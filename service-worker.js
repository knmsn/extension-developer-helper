function copyFormValues(formId) {
    const formData = {};
    try {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach((input) => {
            if (input.name || input.id) {
                const key = input.name || input.id;
                formData[key] = input.value;
            }
        });

        chrome.storage.local.get('forms', (data) => {
            try {
                let forms = data.forms || [];

                const formIndex = forms.findIndex((form) => form.id === formId);
                if (formIndex !== -1) {
                    forms[formIndex].values = formData;

                    chrome.storage.local.set({ forms }, () => {
                        console.log(`Formulário ${formId} atualizado com sucesso!`);
                    });
                } else {
                    console.error("Formulário não encontrado no armazenamento.");
                }
            } catch (storageError) {
                console.error("Erro ao armazenar dados no chrome.storage.local:", storageError);
            }
        });
    } catch (error) {
        console.error("Erro ao copiar valores do formulário:", error);
    }
}


function pasteFormValues(formId) {
    try {
        chrome.storage.local.get('forms', (data) => {
            try {
                const forms = data.forms || [];
                const form = forms.find(f => f.id === formId);
                if (!form) {
                    console.error("Formulário não encontrado!");
                    return;
                }
                const formData = form.values || {};
                const inputs = document.querySelectorAll('input, textarea, select');
                inputs.forEach((input) => {
                    const key = input.name || input.id;
                    if (key && formData[key] !== undefined) {
                        input.value = formData[key];
                    }
                });
            } catch (retrieveError) {
                console.error("Erro ao recuperar dados do chrome.storage.local:", retrieveError);
            }
        });
    } catch (error) {
        console.error("Erro ao colar valores nos campos:", error);
    }
}



function springLogStyle() {
    const bootstrapCssImportTag = document.createElement('link');
    bootstrapCssImportTag.rel = 'stylesheet';
    bootstrapCssImportTag.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css';
    document.head.appendChild(bootstrapCssImportTag);

    const logContainer = document.querySelector('pre');
    if (!logContainer) {
        console.error('Container do log não encontrado.');
        return;
    }

    const log = logContainer.innerText;
    logContainer.remove();

    const accordion = document.createElement('div');
    accordion.classList.add('accordion');
    accordion.id = 'accordion';

    const logPattern = /(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}\.\d{3})\s+(ERROR|WARN|INFO)\s+(\d+) --- (\[.*?\]) (.*?)\s+:\s+([\s\S]*?)(?=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\s+(ERROR|WARN|INFO)|$)/g;

    let matches;
    const result = [];

    while ((matches = logPattern.exec(log)) !== null) {
        const date = matches[1];
        const time = matches[2];
        const type = matches[3];
        const source = matches[6];
        const details = matches[7].trim();
        
        result.push({
            date,
            time,
            type,
            source,
            details
        });
    }

    document.body.appendChild(accordion);

    result.forEach((logEntry, index) => {
        const card = document.createElement('div');
        card.classList.add('accordion-item');

        const cardHeader = document.createElement('div');
        cardHeader.classList.add('accordion-header');
        cardHeader.id = `heading${index + 1}`;
        
        const h5 = document.createElement('h5');
        h5.classList.add('mb-0');
        
        const button = document.createElement('button');
        button.classList.add('accordion-button', 'collapsed');
        button.setAttribute('data-bs-toggle', 'collapse');
        button.setAttribute('data-bs-target', `#collapse${index + 1}`);
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', `collapse${index + 1}`);
        
        button.textContent = `${logEntry.type}: ${logEntry.source}`;
        
        h5.appendChild(button);
        cardHeader.appendChild(h5);
        
        const collapseDiv = document.createElement('div');
        collapseDiv.id = `collapse${index + 1}`;
        collapseDiv.classList.add('accordion-collapse', 'collapse');
        collapseDiv.setAttribute('aria-labelledby', cardHeader.id);
        collapseDiv.setAttribute('data-bs-parent', '#accordion');
        
        const cardBody = document.createElement('div');
        cardBody.classList.add('accordion-body');
        cardBody.innerHTML = `
            <strong>Data:</strong> ${logEntry.date}<br>
            <strong>Hora:</strong> ${logEntry.time}<br>
            <strong>Tipo:</strong> ${logEntry.type}<br>
            <strong>Fonte:</strong> ${logEntry.source}<br>
            <strong>Detalhes:</strong> ${logEntry.details}
        `;
        
        collapseDiv.appendChild(cardBody);
        card.appendChild(cardHeader);
        card.appendChild(collapseDiv);
        accordion.appendChild(card);
    });
}



function removeSpringLogStyle() {
    const logContainer = document.querySelector('pre');
    if (!logContainer) {
        console.error('Container do log não encontrado para desestilização.');
        return;
    }
    logContainer.innerHTML = logContainer.dataset.originalLog.split('\n')
        .map(line => `<div>${line}</div>`)
        .join('');
}



chrome.runtime.onMessage.addListener(({ action, tabId, formId }) => {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        if (action === "activateStyle") {
            chrome.scripting
                .executeScript({
                    target: { tabId: tabId, allFrames: true },
                    files: ["js/bootstrap.bundle.min.js"],
                })
                .then(() => console.log("script injected in all frames"));
            chrome.scripting.executeScript({
                target: { tabId },
                function: springLogStyle
            })
        }
        if (action === "copy") {
            chrome.scripting.executeScript({
                target: { tabId }, 
                func: copyFormValues,
                args: [formId]
            });
        }
        if (action === "paste") {
            chrome.scripting.executeScript({
                target: { tabId },
                func: pasteFormValues,
                args: [formId]
            })
        }
    });
});
