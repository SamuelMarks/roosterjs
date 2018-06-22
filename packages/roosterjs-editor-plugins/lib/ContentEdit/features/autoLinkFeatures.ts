import { ChangeSource, LinkData, PluginDomEvent } from 'roosterjs-editor-types';
import { ContentEditFeature } from '../ContentEditFeatures';
import { Editor, cacheGetEventData } from 'roosterjs-editor-core';
import { cacheGetCursorEventData, clearCursorEventDataCache, replaceTextBeforeCursorWithNode } from 'roosterjs-editor-api';
import { matchLink } from 'roosterjs-editor-dom';

// When user type, they may end a link with a puncatuation, i.e. www.bing.com;
// we need to trim off the trailing puncatuation before turning it to link match
const TRAILING_PUNCTUATION_REGEX = /[.()+={}\[\]\s:;"',>]+$/i;
const MINIMUM_LENGTH = 5;
const KEY_ENTER = 13;
const KEY_SPACE = 32;

export const AutoLink: ContentEditFeature = {
    keys: [KEY_ENTER, KEY_SPACE],
    shouldHandleEvent: cacheGetLinkData,
    handleEvent: autoLink,
};

function cacheGetLinkData(event: PluginDomEvent, editor: Editor): LinkData {
    return cacheGetEventData(event, 'LINK_DATA', () => {
        let cursorData = cacheGetCursorEventData(event, editor);
        let wordBeforeCursor = cursorData && cursorData.wordBeforeCursor;
        if (wordBeforeCursor && wordBeforeCursor.length > MINIMUM_LENGTH) {
            // Check for trailing punctuation
            let trailingPunctuations = wordBeforeCursor.match(TRAILING_PUNCTUATION_REGEX);
            let trailingPunctuation = (trailingPunctuations || [])[0] || '';

            // Compute the link candidate
            let linkCandidate = wordBeforeCursor.substring(
                0,
                wordBeforeCursor.length - trailingPunctuation.length
            );

            // Match and replace in editor
            return matchLink(linkCandidate);
        }
        return null;
    });
}

function autoLink(event: PluginDomEvent, editor: Editor) {
    let anchor = editor.getDocument().createElement('a');
    let linkData = cacheGetLinkData(event, editor);
    anchor.textContent = linkData.originalUrl;
    anchor.href = linkData.normalizedUrl;

    editor.runAsync(() => {
        editor.performAutoComplete(() => {
            replaceTextBeforeCursorWithNode(
                editor,
                linkData.originalUrl,
                anchor,
                false /* exactMatch */
            );

            // The content at cursor has changed. Should also clear the cursor data cache
            clearCursorEventDataCache(event);
            return anchor;
        }, ChangeSource.AutoLink);
    });
}
