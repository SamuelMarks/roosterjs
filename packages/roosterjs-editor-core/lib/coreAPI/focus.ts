import EditorCore from '../editor/EditorCore';
import getLiveRange from './getLiveRange';
import hasFocus from './hasFocus';
import isVoidHtmlElement from '../utils/isVoidHtmlElement';
import select from './select';
import { NodeType, Position } from 'roosterjs-editor-types';
import { getFirstLeafNode } from 'roosterjs-editor-dom';

export default function focus(core: EditorCore) {
    if (!hasFocus(core) || !getLiveRange(core)) {
        // Focus (document.activeElement indicates) and selection are mostly in sync, but could be out of sync in some extreme cases.
        // i.e. if you programmatically change window selection to point to a non-focusable DOM element (i.e. tabindex=-1 etc.).
        // On Chrome/Firefox, it does not change document.activeElement. On Edge/IE, it change document.activeElement to be body
        // Although on Chrome/Firefox, document.activeElement points to editor, you cannot really type which we don't want (no cursor).
        // So here we always do a live selection pull on DOM and make it point in Editor. The pitfall is, the cursor could be reset
        // to very begin to of editor since we don't really have last saved selection (created on blur which does not fire in this case).
        // It should be better than the case you cannot type
        if (!(core.cachedRange && select(core, core.cachedRange))) {
            setSelectionToBegin(core);
        }
    }

    // remember to clear cachedRange
    core.cachedRange = null;

    // This is more a fallback to ensure editor gets focus if it didn't manage to move focus to editor
    if (!hasFocus(core)) {
        core.contentDiv.focus();
    }
}

function setSelectionToBegin(core: EditorCore) {
    let firstNode = getFirstLeafNode(core.contentDiv);
    if (firstNode) {
        if (firstNode.nodeType == NodeType.Text) {
            // First node is text, move selection to the begin
            select(core, firstNode, Position.Begin);
        } else if (firstNode.nodeType == NodeType.Element) {
            if (isVoidHtmlElement(firstNode as HTMLElement)) {
                // First node is a html void element (void elements cannot have child nodes), move selection before it
                select(core, firstNode, Position.Before);
            } else {
                // Other html element, move selection inside it
                select(core, firstNode, Position.Begin);
            }
        }
    } else {
        // No first node, likely we have an empty content DIV, move selection inside it
        select(core, core.contentDiv, Position.Begin);
    }
}