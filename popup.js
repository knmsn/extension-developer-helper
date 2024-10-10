document.addEventListener('DOMContentLoaded', () => {
    loadForms();
    const buttonFormatarSpring = document.querySelector('#formatar-spring');
    buttonFormatarSpring.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            const tabId = tabs[0].id
            chrome.runtime.sendMessage({ action: "activateStyle", tabId });
        });
    });

    function showToast(message, type = 'success') {
        const toastEl = document.getElementById('successToast');
        const toastMessage = document.getElementById('toastMessage');
        toastMessage.innerHTML = message;
        toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-info');
        if (type === 'success') {
            toastEl.classList.add('text-bg-success');
        } else if (type === 'error') {
            toastEl.classList.add('text-bg-danger');
        } else if (type === 'info') {
            toastEl.classList.add('text-bg-info');
        }
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    document.getElementById('saveForm').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('formNameModal'));
        modal.show();
    });

    document.getElementById('saveFormName').addEventListener('click', () => {
        const formName = document.getElementById('formName').value;
        if (formName) {
            const formId = Math.random().toString(36).substr(2, 9);
            const form = {
                id: formId,
                name: formName,
                values: []
            };
            chrome.storage.local.get('forms', (data) => {
                const forms = data.forms || [];
                forms.push(form);
                chrome.storage.local.set({ forms }, () => {
                    showToast(`Nome do formulário "${formName}" salvo com sucesso!`, 'success');
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        const tabId = tabs[0].id;
                        chrome.runtime.sendMessage({ action: "copy", tabId, formId });
                    });

                    // Agora a função 'addFormToTable' deve ser chamada com o objeto 'form'
                    addFormToTable(form);

                    const modal = bootstrap.Modal.getInstance(document.getElementById('formNameModal'));
                    modal.hide();
                });
            });
        } else {
            showToast('Por favor, insira um nome para o formulário.', 'error');
        }
    });

    function addFormToTable(form) {
        const tableBody = document.querySelector('tbody');
        const newRow = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = form.name;
        newRow.appendChild(nameCell);
        const actionsCell = document.createElement('td');
        const useButton = document.createElement('button');
        useButton.classList.add('btn', 'btn-success');
        useButton.style.marginRight = '15px';
        useButton.textContent = 'Usar';
        useButton.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const tabId = tabs[0].id;
                chrome.runtime.sendMessage({
                    action: "paste", 
                    tabId: tabId, 
                    formId: form.id 
                });
            });
        });

        actionsCell.appendChild(useButton);
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('btn', 'btn-danger');
        deleteButton.textContent = 'Deletar';
        deleteButton.addEventListener('click', () => {
            deleteForm(form.id, newRow);
        });
        actionsCell.appendChild(deleteButton);
        newRow.appendChild(actionsCell);
        tableBody.appendChild(newRow);
    }

    function loadForms() {
        chrome?.storage?.local?.get('forms', (data) => {
            const forms = data.forms || [];
            if (forms.length > 0) {
                forms.forEach(form => {
                    addFormToTable(form);
                });
            } 
        });
    }

    function deleteForm(formId, row) {
        chrome.storage.local.get('forms', (data) => {
            const forms = data.forms || [];
            const updatedForms = forms.filter((form) => form.id !== formId);
            chrome.storage.local.set({ forms: updatedForms }, () => {
                showToast(`Formulário com ID ${formId} deletado com sucesso!`, 'success');
                row.remove();
            });
        });
    }
});
