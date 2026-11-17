const styleElement = document.createElement("style");
styleElement.textContent = `
    .cookie_banner-wrap {
        display: none !important;
    }
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
    #ds-enhancer-menu {
        position: fixed;
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
(document.head || document.documentElement).appendChild(styleElement);

const SEND_BUTTON_SELECTOR = 'div[role="button"].ds-button--primary';
const TEXTAREA_SELECTOR = 'textarea[name="search"]';

const nativeValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
).set;

const clickedBoxes = new WeakSet();

let isThoughtsHidden = false;
let allInstructions = [];
let defaultInstruction = null;
let activeInstructions = [];
let isMenuOpen = false;
let filteredInstructions = [];
let selectedIndex = 0;
let isHijacking = false;
let frameQueued = false;

const menuElement = document.createElement("div");
menuElement.id = "ds-enhancer-menu";
menuElement.addEventListener("mousedown", (e) => e.preventDefault());
document.body.appendChild(menuElement);

function getTextarea() {
    return document.querySelector(TEXTAREA_SELECTOR);
}

function setTextareaValue(textarea, value) {
    nativeValueSetter.call(textarea, value);
}

function isThoughtLabel(span) {
    const label = span.textContent.trim();
    if (label.length === 0 || label.length > 80) return false;
    return label.startsWith("Thinking") || label.startsWith("Thought");
}

function applyHidingLogic() {
    if (!isThoughtsHidden) return;

    document.querySelectorAll("span").forEach((span) => {
        if (!isThoughtLabel(span)) return;
        const parent = span.parentElement;
        const clickableWrapper = parent ? parent.parentElement : null;
        if (clickableWrapper && !clickedBoxes.has(clickableWrapper)) {
            clickedBoxes.add(clickableWrapper);
            clickableWrapper.click();
        }
    });
}

function isValidInstruction(item) {
    return (
        item !== null &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        typeof item.text === "string"
    );
}

function setInstructions(list) {
    allInstructions = Array.isArray(list)
        ? list.filter(isValidInstruction)
        : [];
    defaultInstruction = allInstructions.find((item) => item.isDefault) || null;
    activeInstructions = activeInstructions
        .map((active) => allInstructions.find((item) => item.id === active.id))
        .filter(Boolean);
    renderChips();
}

function injectChipBar() {
    const textarea = getTextarea();
    if (!textarea) return;

    const inputWrapper =
        textarea.closest("._77cefa5") ||
        textarea.closest(".aaff8b8f") ||
        (textarea.parentElement ? textarea.parentElement.parentElement : null);

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

    chipBar.replaceChildren();

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

function renderMenu(textarea) {
    menuElement.replaceChildren();
    filteredInstructions.forEach((item, index) => {
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
    menuElement.classList.add("open");
    isMenuOpen = true;

    const rect = textarea.getBoundingClientRect();
    const top = rect.top - menuElement.offsetHeight - 10;
    menuElement.style.left = `${Math.max(8, rect.left)}px`;
    menuElement.style.top = `${top < 8 ? rect.bottom + 10 : top}px`;
}

function closeMenu() {
    menuElement.classList.remove("open");
    isMenuOpen = false;
}

function updateSelection() {
    const items = menuElement.querySelectorAll(".ds-menu-item");
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.classList.add("selected");
            item.scrollIntoView({ block: "nearest" });
        } else {
            item.classList.remove("selected");
        }
    });
}

function selectInstruction(textarea, instruction) {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastColons = textBeforeCursor.lastIndexOf(":::");
    if (lastColons === -1) {
        closeMenu();
        return;
    }

    const newText = text.substring(0, lastColons) + text.substring(cursorPos);

    setTextareaValue(textarea, newText);
    textarea.setSelectionRange(lastColons, lastColons);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.setSelectionRange(lastColons, lastColons);

    if (!activeInstructions.some((item) => item.id === instruction.id)) {
        activeInstructions.push(instruction);
        renderChips();
    }

    closeMenu();
    textarea.focus();
}

function handleInput(e) {
    if (isHijacking) return;

    const textarea = e.currentTarget;
    const textBeforeCursor = textarea.value.substring(
        0,
        textarea.selectionStart,
    );
    const lastColons = textBeforeCursor.lastIndexOf(":::");

    if (lastColons === -1) {
        closeMenu();
        return;
    }

    const query = textBeforeCursor.substring(lastColons + 3);
    if (/\s/.test(query)) {
        closeMenu();
        return;
    }

    const loweredQuery = query.toLowerCase();
    filteredInstructions = allInstructions.filter((item) =>
        item.title.toLowerCase().includes(loweredQuery),
    );

    if (filteredInstructions.length === 0) {
        closeMenu();
        return;
    }

    selectedIndex = 0;
    renderMenu(textarea);
    openMenu(textarea);
}

function handleKeydown(e) {
    if (e.isComposing) return;
    const textarea = e.currentTarget;

    if (isMenuOpen) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            selectedIndex = (selectedIndex + 1) % filteredInstructions.length;
            updateSelection();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            selectedIndex =
                (selectedIndex - 1 + filteredInstructions.length) %
                filteredInstructions.length;
            updateSelection();
        } else if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            selectInstruction(textarea, filteredInstructions[selectedIndex]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
        }
        return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
        handleSendHijack(e);
    }
}

function findSendButton() {
    const sendButton = document.querySelector(SEND_BUTTON_SELECTOR);
    if (
        sendButton &&
        !sendButton.classList.contains("ds-button--disabled") &&
        sendButton.getAttribute("aria-disabled") !== "true"
    ) {
        return sendButton;
    }
    return null;
}

function handleSendHijack(e) {
    if (isHijacking) return;
    if (defaultInstruction === null && activeInstructions.length === 0) return;

    const textarea = getTextarea();
    if (!textarea) return;

    const userText = textarea.value.trim();
    if (userText === "") return;

    e.preventDefault();
    e.stopPropagation();
    isHijacking = true;
    closeMenu();

    let finalPrompt = "";

    if (defaultInstruction) {
        finalPrompt += `[System Instruction: ${defaultInstruction.text}]\n\n`;
    }

    activeInstructions.forEach((chip) => {
        finalPrompt += `[Additional Instruction: ${chip.text}]\n\n`;
    });

    finalPrompt += userText;

    setTextareaValue(textarea, finalPrompt);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    let attempts = 0;

    function trySend() {
        const sendButton = findSendButton();
        if (sendButton) {
            sendButton.click();
            activeInstructions = [];
            renderChips();
            isHijacking = false;
            return;
        }

        attempts += 1;
        if (attempts < 10) {
            setTimeout(trySend, 50);
            return;
        }

        const currentTextarea = getTextarea();
        if (currentTextarea && currentTextarea.value === finalPrompt) {
            setTextareaValue(currentTextarea, userText);
            currentTextarea.dispatchEvent(
                new Event("input", { bubbles: true }),
            );
        }
        isHijacking = false;
    }

    setTimeout(trySend, 50);
}

function attachTextareaHandlers() {
    const textarea = getTextarea();
    if (!textarea || textarea.dataset.dsEnhancerAttached) return;

    textarea.dataset.dsEnhancerAttached = "true";
    textarea.addEventListener("input", handleInput);
    textarea.addEventListener("keydown", handleKeydown, true);
    textarea.addEventListener("blur", closeMenu);
}

document.addEventListener(
    "click",
    (e) => {
        if (!(e.target instanceof Element)) return;
        const sendButton = e.target.closest(SEND_BUTTON_SELECTOR);
        if (sendButton) {
            handleSendHijack(e);
        }
    },
    true,
);

function runPageWork() {
    frameQueued = false;
    applyHidingLogic();
    injectChipBar();
    attachTextareaHandlers();
}

function schedulePageWork() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(runPageWork);
}

new MutationObserver(schedulePageWork).observe(document.documentElement, {
    childList: true,
    subtree: true,
});

browser.storage.local
    .get(["hide_thoughts", "custom_instructions"])
    .then((result) => {
        isThoughtsHidden = result.hide_thoughts === true;
        setInstructions(result.custom_instructions);
        schedulePageWork();
    });

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;

    if (changes.hide_thoughts) {
        isThoughtsHidden = changes.hide_thoughts.newValue === true;
        if (isThoughtsHidden) schedulePageWork();
    }

    if (changes.custom_instructions) {
        setInstructions(changes.custom_instructions.newValue);
    }
});

schedulePageWork();
