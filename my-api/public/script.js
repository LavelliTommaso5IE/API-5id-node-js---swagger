const baseurl = "https://jubilant-space-goldfish-x5q6rj7xjjpwc9q6r-3000.app.github.dev/api";
const apiKey = "5IDtoken";

let currentPage = 1;
const usersPerPage = 4;

// id stabile → card DOM
const existingCards = new Map();

// nome precedente → id stabile
const userKeyMap = new Map();

// Lista globale degli utenti
let allUsers = [];

function generateId() {
    return crypto.randomUUID();
}

// ============================
// FETCH USERS
// ============================
async function fetchUsers() {
    try {
        const response = await fetch(`${baseurl}/users`);
        const users = await response.json();

        // Salva gli utenti nella variabile globale
        allUsers = users;

        let npagine = Math.ceil(users.length / usersPerPage);
        aggiornaPaginazione(npagine);

        updateData(users);

    } catch (err) {
        console.error("Error fetching users:", err);
    }
}

// ============================
// DOM UPDATE
// ============================
function updateData(users) {
    const template = document.getElementById("user-card-template");

    const stillPresent = new Set();

    users.forEach(user => {
        // Chiave stabile generata da name+age
        const key = `${user.name}-${user.age}`;

        // Se non ho mai visto questa combinazione → creo id fisso
        if (!userKeyMap.has(key)) {
            userKeyMap.set(key, generateId());
        }

        const id = userKeyMap.get(key);

        let card = existingCards.get(id);

        // SE NON ESISTE → CREO LA CARD
        if (!card) {
            const clone = template.content.cloneNode(true);
            card = clone.querySelector(".col-12");
            const btn = card.querySelector(".btn");
            btn.className = "btn btn-primary";
            btn.innerText = "Maggiori informazioni";
            btn.setAttribute("type", "button");
            btn.setAttribute("data-bs-toggle", "modal");
            btn.setAttribute("data-bs-target", "#utente");

            btn.addEventListener('click', () => personalizzaModal(id));

            card.dataset.id = id;

            existingCards.set(id, card);
        }

        // Aggiorno solo se necessario
        if (card.dataset.name !== user.name || card.dataset.age !== String(user.age)) {
            card.querySelector(".card-title").textContent = user.name;
            card.querySelector(".card-text").textContent = `Age: ${user.age}`;
            card.querySelector("img").src = user.data?.img || "Imgs/noImg.jpg";

            card.dataset.name = user.name;
            card.dataset.age = user.age;
        }

        stillPresent.add(id);
    });

    // Rimuovo utenti non più presenti
    existingCards.forEach((card, id) => {
        if (!stillPresent.has(id)) {
            card.remove();
            existingCards.delete(id);
        }
    });

    updateContainer();
}

function updateContainer(){
    const container = document.getElementById("utenti");
    container.innerHTML = "";

    const cardsArray = Array.from(existingCards.values());
    
    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;

    cardsArray.slice(start, end).forEach(card => {
        container.appendChild(card);
    });
}

// ============================
// PAGINAZIONE
// ============================
function aggiornaPaginazione(pagine) {
    const paginazione = document.querySelector(".pagination");

    paginazione.innerHTML = `
        <li class="page-item"><a href="#" class="page-link" data-nav="prev">Previous</a></li>
    `;

    for (let i = 1; i <= pagine; i++) {
        const li = document.createElement("li");
        li.classList.add("page-item");
        if (i === currentPage) li.classList.add("active");

        li.innerHTML = `<a href="#" class="page-link" data-page="${i}">${i}</a>`;
        paginazione.appendChild(li);
    }

    paginazione.innerHTML += `
        <li class="page-item"><a href="#" class="page-link" data-nav="next">Next</a></li>
    `;

    // Eventi di paginazione
    paginazione.querySelectorAll("a").forEach(a => {
        a.onclick = e => {
            e.preventDefault();

            if (a.dataset.page) {
                currentPage = parseInt(a.dataset.page);
            } else if (a.dataset.nav === "prev" && currentPage > 1) {
                currentPage--;
            } else if (a.dataset.nav === "next" && currentPage < pagine) {
                currentPage++;
            }

            updateContainer();
        };
    });
}

// ============================
// FUNZIONE: PERSONALIZZA IL MODAL DEI DETTAGLI
// ============================

function personalizzaModal(id) {
    const modal = document.querySelector("#utente");
    const titolo = modal.querySelector(".modal-title");
    const body = modal.querySelector(".modal-body");

    // Recupera la card corrispondente all'ID
    let card = existingCards.get(id);
    if (!card) return;

    let username = card.dataset.name;

    const modalBtnElimina = modal.querySelector(".btn-danger");

    // CORREZIONE: Rimuovi event listener precedenti
    const newModalBtnElimina = modalBtnElimina.cloneNode(true);
    modalBtnElimina.parentNode.replaceChild(newModalBtnElimina, modalBtnElimina);

    newModalBtnElimina.onclick = () => {
        fetch(`${baseurl}/users/${username}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Rimuovi l'utente dalla lista globale
            allUsers = allUsers.filter(user => user.name !== username);
            // Rimuovi la card dalla mappa e dal DOM
            existingCards.delete(id);
            updateContainer();
            let npagine = Math.ceil(allUsers.length / usersPerPage);
            aggiornaPaginazione(npagine);
            // Chiudi il modal
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        })
        .catch(err => {
            console.error("Errore nell'eliminazione dell'utente:", err);
            alert("Errore nell'eliminazione dell'utente.");
        });
    }

    const modalBtnModifica = modal.querySelector(".btn-secondary");
    
    // CORREZIONE: Rimuovi event listener precedenti
    const newModalBtnModifica = modalBtnModifica.cloneNode(true);
    modalBtnModifica.parentNode.replaceChild(newModalBtnModifica, modalBtnModifica);

    newModalBtnModifica.setAttribute("data-bs-toggle", "modal");
    newModalBtnModifica.setAttribute("data-bs-target", "#modificaUtenteModal");

    newModalBtnModifica.onclick = () => {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
        
        const modalModifica = document.querySelector("#modificaUtenteModal");
        const titoloModifica = modalModifica.querySelector(".modal-title");
        titoloModifica.textContent = `Modifica utente: ${username}`;

        // Precompila i campi del form
        document.getElementById('m-username').value = username;
        const user = allUsers.find(u => u.name === username);
        document.getElementById('m-eta').value = user.age;
        document.getElementById('m-email').value = user.data?.email || "";
        document.getElementById('m-telefono').value = user.data?.phone || "";
        document.getElementById('m-immagine').value = user.data?.img || "";
        
        const btnSalvaModifica = document.getElementById('btnSalvaModifica');

        // CORREZIONE: Rimuovi event listener precedenti
        const newBtnSalvaModifica = btnSalvaModifica.cloneNode(true);
        btnSalvaModifica.parentNode.replaceChild(newBtnSalvaModifica, btnSalvaModifica);

        newBtnSalvaModifica.onclick = function() {
            const form = document.getElementById('formModificaUtente');

            // Controlla se il form è valido
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            const newUser = {
                name: document.getElementById('m-username').value,
                age: parseInt(document.getElementById('m-eta').value)
            };

            // Aggiungi campi opzionali se presenti
            const email = document.getElementById('m-email').value;
            const telefono = document.getElementById('m-telefono').value;
            const immagine = document.getElementById('m-immagine').value;

            if (immagine) {
                newUser.data = newUser.data || {};
                newUser.data.img = immagine;
            }

            if (email) {
                newUser.data = newUser.data || {};
                newUser.data.email = email;
            }

            if (telefono) {
                newUser.data = newUser.data || {};
                newUser.data.phone = telefono;
            }

            fetch(`${baseurl}/users/${username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(newUser)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Utente modificato con successo:', data);
                
                // Aggiorna la lista globale
                allUsers = allUsers.map(user => user.name === username ? newUser : user);
                updateData(allUsers);

                const modal = bootstrap.Modal.getInstance(modalModifica);
                if (modal) {
                    modal.hide();
                }
                
                // CORREZIONE: Messaggio appropriato
                alert('Utente modificato con successo!');
            })
            .catch(error => {
                console.error('Errore durante la modifica dell\'utente:', error);
                alert('Si è verificato un errore durante la modifica dell\'utente.');
            });
        };
    }

    // Fetch dell'utente specifico
    fetch(`${baseurl}/users/${username}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(user => {
            // Aggiorna contenuto del modal
            titolo.textContent = user.name;
            let email = user.data?.email ?? "//";
            let phone = user.data?.phone ?? "//";
            let immagine = user.data?.img ?? "Imgs/noImg.jpg";
            body.innerHTML = `
                <p><strong>Nome:</strong> ${user.name}</p>
                <p><strong>Age:</strong> ${user.age}</p>
                <p><strong>Email: </strong> ${email}</p>
                <p><strong>Numero di cellulare: </strong> ${phone}</p>
                <img src="${immagine}" class="img-fluid" alt="${user.name}">
            `;
        })
        .catch(err => {
            console.error("Errore nel fetch dell'utente:", err);
            body.innerHTML = `<p>Errore nel caricamento dei dati.</p>`;
        });
}

// ============================
// AGGIUNGI UTENTE - CORRETTO
// ============================

const btn = document.getElementById('aggiungiUtente');

btn.setAttribute("type", "button");
btn.setAttribute("data-bs-toggle", "modal");
btn.setAttribute("data-bs-target", "#aggiungiUtenteModal");

// CORREZIONE: Setup iniziale una sola volta
let aggiungiUtenteSetup = false;

function setupAggiungiUtente() {
    if (aggiungiUtenteSetup) return;
    aggiungiUtenteSetup = true;

    const btnSalvaUtente = document.getElementById('btnSalvaUtente');

    btnSalvaUtente.onclick = function() {
        const form = document.getElementById('formAggiungiUtente');

        // Controlla se il form è valido
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Prepara i dati per il nuovo utente
        const newUser = {
            name: document.getElementById('username').value,
            age: parseInt(document.getElementById('eta').value)
        };

        // Aggiungi campi opzionali se presenti
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const immagine = document.getElementById('immagine').value;

        if (immagine) {
            newUser.data = newUser.data || {};
            newUser.data.img = immagine;
        }

        if (email) {
            newUser.data = newUser.data || {};
            newUser.data.email = email;
        }

        if (telefono) {
            newUser.data = newUser.data || {};
            newUser.data.phone = telefono;
        }

        // Controlla se l'utente esiste già localmente
        const userExists = allUsers.some(user => 
            user.name.toLowerCase() === newUser.name.toLowerCase()
        );

        if (userExists) {
            alert('Errore: Un utente con questo username esiste già!');
            return;
        }

        // Invia la richiesta POST all'API
        fetch(`${baseurl}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(newUser)
        })
        .then(response => {
            if (response.status === 409) {
                throw new Error('Un utente con questo username esiste già nel database');
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Utente aggiunto con successo:', data);
            
            // Aggiungi l'immagine di default
            if (!immagine){
                newUser.data = newUser.data || {};
                newUser.data.img = "Imgs/noImg.jpg";
            }
            
            // Aggiungi il nuovo utente alla lista globale
            allUsers.push(newUser);
            
            // Aggiorna la visualizzazione
            const key = `${newUser.name}-${newUser.age}`;
        
            // Se non esiste, crea ID univoco
            if (!userKeyMap.has(key)) {
                userKeyMap.set(key, generateId());
            }
            
            const id = userKeyMap.get(key);
            
            // Crea la card DOM solo se non esiste
            if (!existingCards.has(id)) {
                const template = document.getElementById("user-card-template");
                const clone = template.content.cloneNode(true);
                const card = clone.querySelector(".col-12");
                const btn = card.querySelector(".btn");
                
                btn.className = "btn btn-primary";
                btn.innerText = "Maggiori informazioni";
                btn.setAttribute("type", "button");
                btn.setAttribute("data-bs-toggle", "modal");
                btn.setAttribute("data-bs-target", "#utente");
                btn.addEventListener('click', () => personalizzaModal(id));

                card.dataset.id = id;
                card.dataset.name = newUser.name;
                card.dataset.age = newUser.age;
                
                card.querySelector(".card-title").textContent = newUser.name;
                card.querySelector(".card-text").textContent = `Age: ${newUser.age}`;
                card.querySelector("img").src = newUser.data.img;

                existingCards.set(id, card);
            }

            updateContainer();
            
            // Ricalcola la paginazione
            let npagine = Math.ceil(allUsers.length / usersPerPage);
            aggiornaPaginazione(npagine);
            
            // Chiudi il modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('aggiungiUtenteModal'));
            if (modal) {
                modal.hide();
            }
            
            // Reset del form
            form.reset();
            form.classList.remove('was-validated');
            
            alert('Utente aggiunto con successo!');
        })
        .catch(error => {
            console.error('Errore durante l\'aggiunta dell\'utente:', error);
            if (error.message.includes('esiste già')) {
                alert('Errore: ' + error.message);
            } else {
                alert('Si è verificato un errore durante l\'aggiunta dell\'utente.');
            }
        });
    };
}

// ============================
// INIZIALIZZAZIONE
// ============================
window.onload = () => {
    fetchUsers();
    setupAggiungiUtente(); // CORREZIONE: Setup una volta sola
    setInterval(fetchUsers, 5000);
};