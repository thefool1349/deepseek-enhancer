document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("hide-thought-toggle");
    browser.storage.local.get("hide_thoughts").then((result) => {
        if (result.hide_thoughts !== undefined)
            toggle.checked = result.hide_thoughts === true;
    });
    toggle.addEventListener("change", () => {
        browser.storage.local.set({ hide_thoughts: toggle.checked });
    });

    const modal = document.getElementById("custom-modal");
    const modalMessage = document.getElementById("modal-message");
    const btnModalOk = document.getElementById("btn-modal-ok");
    const btnModalCancel = document.getElementById("btn-modal-cancel");

    function showModal(message) {
        return new Promise((resolve) => {
            modalMessage.textContent = message;
            modal.style.display = "flex";

            btnModalOk.onclick = () => {
                modal.style.display = "none";
                resolve(true);
            };
            btnModalCancel.onclick = () => {
                modal.style.display = "none";
                resolve(false);
            };
        });
    }

    const btnToggleInstruction = document.getElementById(
        "btn-toggle-instruction",
    );
    const instructionContainer = document.getElementById(
        "instruction-input-container",
    );
    const titleInput = document.getElementById("instruction-title");
    const bodyInput = document.getElementById("instruction-body");
    const btnSaveInstruction = document.getElementById("btn-save-instruction");
    const instructionList = document.getElementById("instruction-list");

    let customInstructions = [];
    let editingId = null;

    function isValidInstruction(item) {
        return (
            item !== null &&
            typeof item === "object" &&
            typeof item.title === "string" &&
            typeof item.text === "string"
        );
    }

    function createActionButton(className, label, handler) {
        const button = document.createElement("button");
        button.className = className;
        button.textContent = label;
        button.addEventListener("click", handler);
        return button;
    }

    function renderList() {
        instructionList.replaceChildren();

        if (customInstructions.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.textContent = "No custom instructions yet.";
            emptyItem.style.cssText =
                "color: #9ca3af; font-size: 12px; justify-content: center; border: none; background: transparent;";
            instructionList.appendChild(emptyItem);
            return;
        }

        customInstructions.forEach((item) => {
            const li = document.createElement("li");

            const info = document.createElement("div");
            info.style.cssText =
                "display: flex; flex-direction: column; gap: 4px; text-align: left; overflow: hidden;";

            const title = document.createElement("span");
            title.style.cssText =
                "color: #93c5fd; font-weight: bold; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;";
            title.textContent = item.title;

            const text = document.createElement("span");
            text.style.cssText =
                "font-size: 11px; color: #d4d4d8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;";
            text.textContent = item.text;

            info.appendChild(title);
            info.appendChild(text);

            const actions = document.createElement("div");
            actions.className = "action-buttons";

            const star = createActionButton(
                item.isDefault ? "btn-star is-default" : "btn-star",
                item.isDefault ? "\u2605" : "\u2606",
                () => toggleDefault(item.id),
            );
            star.title = "Set as Default";

            const edit = createActionButton("btn-edit", "Edit", () =>
                startEditing(item.id),
            );

            const remove = createActionButton("btn-delete", "\u00d7", () =>
                deleteInstruction(item.id),
            );

            actions.appendChild(star);
            actions.appendChild(edit);
            actions.appendChild(remove);

            li.appendChild(info);
            li.appendChild(actions);
            instructionList.appendChild(li);
        });
    }

    function saveToStorage() {
        return browser.storage.local.set({
            custom_instructions: customInstructions,
        });
    }

    async function toggleDefault(id) {
        customInstructions.forEach((item) => {
            if (item.id === id) {
                item.isDefault = !item.isDefault;
            } else {
                item.isDefault = false;
            }
        });
        await saveToStorage();
        renderList();
    }

    btnSaveInstruction.addEventListener("click", async () => {
        const title = titleInput.value.trim();
        const instruction = bodyInput.value.trim();

        if (title === "" || instruction === "") {
            await showModal(
                "Please fill out both the title and the instruction.",
            );
            return;
        }

        const isDuplicate = customInstructions.some(
            (item) =>
                item.id !== editingId &&
                item.title.toLowerCase() === title.toLowerCase(),
        );

        if (isDuplicate) {
            await showModal("An instruction with this title already exists!");
            return;
        }

        if (editingId !== null) {
            const index = customInstructions.findIndex(
                (item) => item.id === editingId,
            );
            if (index !== -1) {
                const wasDefault = customInstructions[index].isDefault === true;
                customInstructions[index] = {
                    id: editingId,
                    title,
                    text: instruction,
                    isDefault: wasDefault,
                };
            }
        } else {
            let newId = Date.now();
            while (customInstructions.some((item) => item.id === newId)) {
                newId += 1;
            }
            customInstructions.push({
                id: newId,
                title: title,
                text: instruction,
                isDefault: false,
            });
        }

        await saveToStorage();
        renderList();
        resetForm();
    });

    function startEditing(id) {
        const itemToEdit = customInstructions.find((item) => item.id === id);
        if (!itemToEdit) return;

        editingId = id;
        titleInput.value = itemToEdit.title;
        bodyInput.value = itemToEdit.text;
        instructionContainer.style.display = "flex";
        btnToggleInstruction.textContent = "Cancel";
        btnSaveInstruction.textContent = "Update Instruction";
        titleInput.focus();
    }

    async function deleteInstruction(id) {
        const isConfirmed = await showModal(
            "Are you sure you want to delete this instruction?",
        );
        if (!isConfirmed) return;

        customInstructions = customInstructions.filter(
            (item) => item.id !== id,
        );
        await saveToStorage();
        renderList();

        if (editingId === id) resetForm();
    }

    function resetForm() {
        editingId = null;
        titleInput.value = "";
        bodyInput.value = "";
        instructionContainer.style.display = "none";
        btnToggleInstruction.textContent = "+ Add Instruction";
        btnSaveInstruction.textContent = "Save Instruction";
    }

    btnToggleInstruction.addEventListener("click", () => {
        if (instructionContainer.style.display === "none") {
            resetForm();
            instructionContainer.style.display = "flex";
            btnToggleInstruction.textContent = "Cancel";
            titleInput.focus();
        } else {
            resetForm();
        }
    });

    browser.storage.local.get("custom_instructions").then((result) => {
        if (Array.isArray(result.custom_instructions)) {
            customInstructions =
                result.custom_instructions.filter(isValidInstruction);
        }
        renderList();
    });
});
