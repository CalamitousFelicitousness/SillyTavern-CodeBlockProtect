import { saveSettingsDebounced } from '../../../../script.js';
import { extension_settings, renderExtensionTemplateAsync } from '../../../extensions.js';
import { power_user } from '../../../power-user.js';
import { MacroEngine } from '../../../macros/engine/MacroEngine.js';

const MODULE_NAME = 'code-block-protect';
const EXTENSION_FOLDER = 'SillyTavern-CodeBlockProtect';

/**
 * Matches fenced code blocks (``` ... ```) and inline code (` ... `).
 * Fenced blocks are matched first (greedy over inline) so nested backticks inside fences are handled.
 */
const CODE_BLOCK_REGEX = /```[\s\S]*?```|`[^`\n]+`/g;

const defaultSettings = {
    enabled: true,
};

// ---- Placeholder storage (stack-based for recursion safety) ----

/** @type {Map<string, string>[]} */
const mapStack = [];
let placeholderCounter = 0;

/**
 * Generates a unique placeholder string that won't collide with macros or normal text.
 * Uses a simple counter - safe because all calls are synchronous within a single evaluate() pass.
 * @returns {string}
 */
function generatePlaceholder() {
    return `\x02CBLK_${placeholderCounter++}\x02`;
}

/**
 * MacroEngine pre-processor: extracts code blocks and replaces them with inert placeholders.
 * @param {string} input
 * @returns {string}
 */
function extractCodeBlocks(input) {
    if (!extension_settings[MODULE_NAME]?.enabled) return input;
    if (!input.includes('`')) return input;

    const map = new Map();
    mapStack.push(map);

    return input.replace(CODE_BLOCK_REGEX, (match) => {
        const placeholder = generatePlaceholder();
        map.set(placeholder, match);
        return placeholder;
    });
}

/**
 * MacroEngine post-processor: restores code blocks from placeholders.
 * @param {string} input
 * @returns {string}
 */
function restoreCodeBlocks(input) {
    if (!extension_settings[MODULE_NAME]?.enabled) return input;

    const map = mapStack.pop();
    if (!map || map.size === 0) return input;

    for (const [placeholder, original] of map) {
        input = input.replaceAll(placeholder, original);
    }
    return input;
}

// ---- Settings UI ----

function loadSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = { ...defaultSettings };
    }
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (extension_settings[MODULE_NAME][key] === undefined) {
            extension_settings[MODULE_NAME][key] = value;
        }
    }
}

// ---- Init ----

jQuery(async () => {
    loadSettings();

    // Register MacroEngine pre/post processors (always - they only fire when new engine is active)
    MacroEngine.instance.addPreProcessor(extractCodeBlocks, {
        priority: 1,
        source: MODULE_NAME,
    });
    MacroEngine.instance.addPostProcessor(restoreCodeBlocks, {
        priority: 999,
        source: MODULE_NAME,
    });

    // Render settings UI
    const settingsHtml = await renderExtensionTemplateAsync(`third-party/${EXTENSION_FOLDER}`, 'settings');
    $('#extensions_settings').append(settingsHtml);

    // Bind UI
    const $enabled = $('#cbp_enabled');
    $enabled.prop('checked', extension_settings[MODULE_NAME].enabled);
    $enabled.on('change', function () {
        extension_settings[MODULE_NAME].enabled = !!$(this).prop('checked');
        saveSettingsDebounced();
    });

    // Show warning if experimental engine is off
    if (power_user?.experimental_macro_engine === false) {
        $('#cbp_legacy_warning').show();
    }

    console.log(`[${MODULE_NAME}] Loaded. Enabled: ${extension_settings[MODULE_NAME].enabled}`);
});
