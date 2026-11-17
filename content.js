const bannerStyle = document.createElement("style");
bannerStyle.textContent = `
    .cookie_banner-wrap {
        display: none !important;
    }
`;
document.head.appendChild(bannerStyle);

let isThoughtsHidden = false;
const clickedBoxes = new WeakSet();

function applyHidingLogic() {
    if (!isThoughtsHidden) return;

    const spans = document.querySelectorAll("span");
    spans.forEach((span) => {
        const text = span.textContent;
        if (text.includes("Thinking") || text.includes("Thought")) {
            let clickableWrapper = span.parentElement.parentElement;
            if (clickableWrapper && !clickedBoxes.has(clickableWrapper)) {
                clickableWrapper.click();
                clickedBoxes.add(clickableWrapper);
            }
        }
    });
}

const thoughtObserver = new MutationObserver(() => {
    if (isThoughtsHidden) applyHidingLogic();
});
thoughtObserver.observe(document.body, { childList: true, subtree: true });

browser.storage.local.get("hide_thoughts").then((result) => {
    isThoughtsHidden = result.hide_thoughts === true;
    if (isThoughtsHidden) applyHidingLogic();
});

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.hide_thoughts) {
        isThoughtsHidden = changes.hide_thoughts.newValue === true;
        if (isThoughtsHidden) applyHidingLogic();
    }
});

const chipStyle = document.createElement("style");
chipStyle.textContent = `
    .ds-enhancer-chip-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px 16px 0 16px;
        width: 100%;
        box-sizing: border-box;
    }
    .ds-enhancer-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: #3f3f46;
        border: 1px solid #52525b;
        border-radius: 16px;
        padding: 4px 10px;
        font-size: 12px;
        color: #ffffff;
        font-family: system-ui, -apple-system, sans-serif;
        animation: chipFadeIn 0.2s ease-out;
    }
    .ds-enhancer-chip-close {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #52525b;
        color: #e4e4e7;
        font-size: 10px;
        transition: all 0.2s;
    }
    .ds-enhancer-chip-close:hover {
        background: #ef4444;
        color: white;
    }
    .ds-enhancer-chip.locked {
        border-color: #3b82f6;
        background-color: rgba(59, 130, 246, 0.15);
        color: #93c5fd;
    }
    @keyframes chipFadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(chipStyle);

let activeInstructions = [];
let defaultInstruction = null;

browser.storage.local.get("custom_instructions").then((result) => {
    if (result.custom_instructions) {
        defaultInstruction =
            result.custom_instructions.find((item) => item.isDefault) || null;
        renderChips();
    }
});

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.custom_instructions) {
        const newInstructions = changes.custom_instructions.newValue;
        defaultInstruction =
            newInstructions.find((item) => item.isDefault) || null;
        renderChips();
    }
});

function injectChipBar() {
    const textarea = document.querySelector('textarea[name="search"]');
    if (!textarea) return;

    const inputWrapper =
        textarea.closest("._77cefa5") ||
        textarea.closest(".aaff8b8f") ||
        textarea.parentElement.parentElement;

    if (inputWrapper && !document.getElementById("ds-enhancer-chip-bar")) {
        const chipBar = document.createElement("div");
        chipBar.id = "ds-enhancer-chip-bar";
        chipBar.className = "ds-enhancer-chip-container";
        inputWrapper.insertBefore(chipBar, inputWrapper.firstChild);
        renderChips();
    }
}

function renderChips() {
    const chipBar = document.getElementById("ds-enhancer-chip-bar");
    if (!chipBar) return;

    chipBar.innerHTML = "";

    if (defaultInstruction) {
        const lockedChip = document.createElement("div");
        lockedChip.className = "ds-enhancer-chip locked";
        const lockedSpan = document.createElement("span");
        lockedSpan.textContent = `🔒 ${defaultInstruction.title}`;
        lockedChip.appendChild(lockedSpan);
        chipBar.appendChild(lockedChip);
    }

    activeInstructions.forEach((instruction) => {
        const chip = document.createElement("div");
        chip.className = "ds-enhancer-chip";

        const titleSpan = document.createElement("span");
        titleSpan.textContent = instruction.title;

        const closeDiv = document.createElement("div");
        closeDiv.className = "ds-enhancer-chip-close";
        closeDiv.dataset.id = instruction.id;
        closeDiv.textContent = "×";

        closeDiv.addEventListener("click", () => {
            activeInstructions = activeInstructions.filter(
                (item) => item.id !== instruction.id,
            );
            renderChips();
        });

        chip.appendChild(titleSpan);
        chip.appendChild(closeDiv);
        chipBar.appendChild(chip);
    });

    chipBar.style.display =
        !defaultInstruction && activeInstructions.length === 0
            ? "none"
            : "flex";
}

const menuStyle = document.createElement("style");
menuStyle.textContent = `
    #ds-enhancer-menu {
        position: absolute;
        background-color: #27272a;
        border: 1px solid #52525b;
        border-radius: 8px;
        padding: 6px 0;
        width: 280px;
        max-height: 250px;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        z-index: 99999;
        display: none;
        font-family: system-ui, -apple-system, sans-serif;
    }
    #ds-enhancer-menu.open { display: block; }
    .ds-menu-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .ds-menu-item.selected, .ds-menu-item:hover { background-color: rgba(255, 255, 255, 0.1); }
    .ds-menu-title { color: #93c5fd; font-weight: 600; font-size: 13px; }
    .ds-menu-desc { color: #d4d4d8; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;
document.head.appendChild(menuStyle);

let menuElement = document.createElement("div");
menuElement.id = "ds-enhancer-menu";
document.body.appendChild(menuElement);

let isMenuOpen = false;
let filteredInstructions = [];
let selectedIndex = 0;

function attachAutocomplete() {
    const textarea = document.querySelector('textarea[name="search"]');
    if (!textarea || textarea.dataset.autocompleteAttached) return;

    textarea.dataset.autocompleteAttached = "true";

    textarea.addEventListener("input", () => {
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        const lastColons = textBeforeCursor.lastIndexOf(":::");

        if (lastColons !== -1) {
            const query = textBeforeCursor.substring(lastColons + 3);
            if (query.includes(" ") || query.includes("\n")) {
                closeMenu();
                return;
            }

            browser.storage.local.get("custom_instructions").then((result) => {
                const instructions = result.custom_instructions || [];
                filteredInstructions = instructions.filter((item) =>
                    item.title.toLowerCase().includes(query.toLowerCase()),
                );

                if (filteredInstructions.length > 0) {
                    selectedIndex = 0;
                    renderMenu(textarea, filteredInstructions);
                    openMenu(textarea);
                } else {
                    closeMenu();
                }
            });
        } else {
            closeMenu();
        }
    });

    textarea.addEventListener("keydown", (e) => {
        if (!isMenuOpen) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredInstructions.length;
            updateSelection();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + filteredInstructions.length) %
                filteredInstructions.length;
            updateSelection();
        } else if (e.key === "Enter") {
            e.preventDefault();
            selectInstruction(textarea, filteredInstructions[selectedIndex]);
        } else if (e.key === "Escape") {
            closeMenu();
        }
    });
}

function renderMenu(textarea, instructions) {
    menuElement.innerHTML = "";
    instructions.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = `ds-menu-item ${index === selectedIndex ? "selected" : ""}`;

        const titleDiv = document.createElement("div");
        titleDiv.className = "ds-menu-title";
        titleDiv.textContent = item.title;

        const descDiv = document.createElement("div");
        descDiv.className = "ds-menu-desc";
        descDiv.textContent = item.text;

        div.appendChild(titleDiv);
        div.appendChild(descDiv);

        div.addEventListener("click", () => selectInstruction(textarea, item));
        menuElement.appendChild(div);
    });
}

function openMenu(textarea) {
    const rect = textarea.getBoundingClientRect();
    menuElement.style.left = `${rect.left}px`;
    menuElement.style.top = `${rect.top - menuElement.offsetHeight - 10}px`;
    menuElement.classList.add("open");
    isMenuOpen = true;
}

function closeMenu() {
    menuElement.classList.remove("open");
    isMenuOpen = false;
}

function updateSelection() {
    const items = menuElement.querySelectorAll(".ds-menu-item");
    items.forEach((item, index) => {
        if (index === selectedIndex) item.classList.add("selected");
        else item.classList.remove("selected");
    });
}

function selectInstruction(textarea, instruction) {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastColons = textBeforeCursor.lastIndexOf(":::");

    const textToKeepBefore = text.substring(0, lastColons);
    const textToKeepAfter = text.substring(cursorPos);
    const newText = textToKeepBefore + textToKeepAfter;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
    ).set;
    nativeInputValueSetter.call(textarea, newText);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.setSelectionRange(lastColons, lastColons);

    if (!activeInstructions.some((item) => item.id === instruction.id)) {
        activeInstructions.push(instruction);
        renderChips();
    }

    closeMenu();
    textarea.focus();
}

let isHijacking = false;

function handleSendHijack(e) {
    if (isHijacking) return;
    if (defaultInstruction === null && activeInstructions.length === 0) return;

    const textarea = document.querySelector('textarea[name="search"]');
    if (!textarea) return;

    const userText = textarea.value.trim();
    if (userText === "") return;

    e.preventDefault();
    e.stopPropagation();
    isHijacking = true;

    let finalPrompt = "";

    if (defaultInstruction) {
        finalPrompt += `[System Instruction: ${defaultInstruction.text}]\n\n`;
    }

    activeInstructions.forEach((chip) => {
        finalPrompt += `[Additional Instruction: ${chip.text}]\n\n`;
    });

    finalPrompt += userText;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
    ).set;
    nativeInputValueSetter.call(textarea, finalPrompt);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
        const sendButton = document.querySelector(
            'div[role="button"].ds-button--primary',
        );
        if (
            sendButton &&
            !sendButton.classList.contains("ds-button--disabled")
        ) {
            sendButton.click();
        }

        activeInstructions = [];
        renderChips();
        isHijacking = false;
    }, 50);
}

function attachSendHijack() {
    const textarea = document.querySelector('textarea[name="search"]');
    if (!textarea || textarea.dataset.hijackAttached) return;

    textarea.dataset.hijackAttached = "true";

    textarea.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                handleSendHijack(e);
            }
        },
        true,
    );

    document.addEventListener(
        "click",
        (e) => {
            const sendButton = e.target.closest(
                'div[role="button"].ds-button--primary',
            );
            if (sendButton) {
                handleSendHijack(e);
            }
        },
        true,
    );
}

setInterval(() => {
    injectChipBar();
    attachAutocomplete();
    attachSendHijack();
}, 500);
