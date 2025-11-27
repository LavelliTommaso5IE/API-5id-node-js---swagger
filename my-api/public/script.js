// URL base dell'API per le chiamate HTTP
const baseurl = "https://jubilant-space-goldfish-x5q6rj7xjjpwc9q6r-3000.app.github.dev/api";
// Chiave API per l'autenticazione nelle richieste
const apiKey = "5IDtoken";

// Variabile per tenere traccia della pagina corrente nella paginazione
let currentPage = 1;
// Numero massimo di utenti da visualizzare per pagina
const usersPerPage = 4;

// Mappa che associa ID univoci stabili agli elementi DOM delle card utente
// Struttura: id_stabile -> elemento_DOM_card
const existingCards = new Map();

// Mappa che associa una chiave composta (nome-età) a un ID stabile
// Serve per mantenere riferimenti consistenti anche se i dati cambiano
const userKeyMap = new Map();

// Array che contiene tutti gli utenti recuperati dall'API
// Funge da cache locale dei dati
let allUsers = [];

/**
 * Genera un ID univoco utilizzando l'API Web Crypto
 * @returns {string} UUID v4 generato
 */
function generateId() {
    return crypto.randomUUID();
}

// ============================
// FETCH USERS - RECUPERO UTENTI
// ============================
/**
 * Recupera la lista degli utenti dall'API e aggiorna l'interfaccia
 * @async
 */
async function fetchUsers() {
    try {
        // Effettua la richiesta GET all'endpoint /users
        const response = await fetch(`${baseurl}/users`);
        // Converte la risposta in formato JSON
        const users = await response.json();

        // Salva gli utenti nella variabile globale per utilizzo successivo
        allUsers = users;

        // Calcola il numero totale di pagine necessarie
        let npagine = Math.ceil(users.length / usersPerPage);
        // Aggiorna la barra di paginazione
        aggiornaPaginazione(npagine);

        // Aggiorna la visualizzazione dei dati nell'interfaccia
        updateData(users);

    } catch (err) {
        // Gestione degli errori nella richiesta
        console.error("Error fetching users:", err);
    }
}

// ============================
// DOM UPDATE - AGGIORNAMENTO INTERFACCIA
// ============================
/**
 * Aggiorna il DOM con i dati degli utenti, creando o modificando le card
 * @param {Array} users - Array di oggetti utente da visualizzare
 */
function updateData(users) {
    // Template HTML per le card utente (definito nel file HTML)
    const template = document.getElementById("user-card-template");

    // Set per tracciare quali utenti sono ancora presenti dopo l'aggiornamento
    const stillPresent = new Set();

    // Itera su ogni utente nell'array
    users.forEach(user => {
        // Crea una chiave univoca basata su nome ed età
        const key = `${user.name}-${user.age}`;

        // Se questa combinazione nome-età non è mai stata vista, genera un ID stabile
        if (!userKeyMap.has(key)) {
            userKeyMap.set(key, generateId());
        }

        // Recupera l'ID stabile associato a questa chiave
        const id = userKeyMap.get(key);

        // Cerca se esiste già una card DOM per questo ID
        let card = existingCards.get(id);

        // SE NON ESISTE → CREO LA CARD DA ZERO
        if (!card) {
            // Clona il contenuto del template
            const clone = template.content.cloneNode(true);
            // Seleziona l'elemento card dal clone
            card = clone.querySelector(".col-12");
            // Seleziona il bottone all'interno della card
            const btn = card.querySelector(".btn");
            
            // Configura il bottone
            btn.className = "btn btn-primary";
            btn.innerText = "Maggiori informazioni";
            btn.setAttribute("type", "button");
            btn.setAttribute("data-bs-toggle", "modal");
            btn.setAttribute("data-bs-target", "#utente");

            // Aggiunge l'event listener per aprire il modal dei dettagli
            btn.addEventListener('click', () => personalizzaModal(id));

            // Imposta l'ID personalizzato come attributo data
            card.dataset.id = id;

            // Salva la card nella mappa per riferimento futuro
            existingCards.set(id, card);
        }

        // AGGIORNA I DATI SOLO SE NECESSARIO (ottimizzazione delle performance)
        // Controlla se i dati visualizzati sono diversi da quelli attuali
        if (card.dataset.name !== user.name || card.dataset.age !== String(user.age)) {
            // Aggiorna il titolo della card con il nome utente
            card.querySelector(".card-title").textContent = user.name;
            // Aggiorna il testo con l'età
            card.querySelector(".card-text").textContent = `Age: ${user.age}`;
            // Aggiorna l'immagine (usa l'immagine dall'API o quella di default)
            card.querySelector("img").src = user.data?.img || "Imgs/noImg.jpg";

            // Aggiorna gli attributi data per futuri confronti
            card.dataset.name = user.name;
            card.dataset.age = user.age;
        }

        // Aggiungi l'ID al set degli utenti attualmente presenti
        stillPresent.add(id);
    });

    // RIMOZIONE UTENTI NON PIÙ PRESENTI
    // Itera su tutte le card esistenti
    existingCards.forEach((card, id) => {
        // Se l'ID non è nel set degli utenti ancora presenti
        if (!stillPresent.has(id)) {
            // Rimuovi la card dal DOM
            card.remove();
            // Rimuovi la card dalla mappa
            existingCards.delete(id);
        }
    });

    // Aggiorna il container con la paginazione applicata
    updateContainer();
}

/**
 * Aggiorna il container principale visualizzando solo gli utenti della pagina corrente
 */
function updateContainer(){
    // Seleziona il container dove verranno inserite le card
    const container = document.getElementById("utenti");
    // Pulisce il container (rimuove tutti gli elementi figli)
    container.innerHTML = "";

    // Converte la mappa delle card in array per poter applicare slice
    const cardsArray = Array.from(existingCards.values());
    
    // Calcola l'indice di inizio per la paginazione
    const start = (currentPage - 1) * usersPerPage;
    // Calcola l'indice di fine per la paginazione
    const end = start + usersPerPage;

    // Prende solo le card della pagina corrente e le aggiunge al container
    cardsArray.slice(start, end).forEach(card => {
        container.appendChild(card);
    });
}

// ============================
// PAGINAZIONE - GESTIONE NAVIGAZIONE PAGINE
// ============================
/**
 * Crea e aggiorna la barra di paginazione
 * @param {number} pagine - Numero totale di pagine
 */
function aggiornaPaginazione(pagine) {
    // Seleziona l'elemento UL della paginazione
    const paginazione = document.querySelector(".pagination");

    // Inizializza la paginazione con il bottone "Previous"
    paginazione.innerHTML = `
        <li class="page-item"><a href="#" class="page-link" data-nav="prev">Previous</a></li>
    `;

    // Crea i link numerati per ogni pagina
    for (let i = 1; i <= pagine; i++) {
        const li = document.createElement("li");
        li.classList.add("page-item");
        // Evidenzia la pagina corrente
        if (i === currentPage) li.classList.add("active");

        // Crea il link con attributo data-page per identificare la pagina
        li.innerHTML = `<a href="#" class="page-link" data-page="${i}">${i}</a>`;
        paginazione.appendChild(li);
    }

    // Aggiunge il bottone "Next" alla fine
    paginazione.innerHTML += `
        <li class="page-item"><a href="#" class="page-link" data-nav="next">Next</a></li>
    `;

    // Aggiunge gli event listener a tutti i link di paginazione
    paginazione.querySelectorAll("a").forEach(a => {
        a.onclick = e => {
            // Previene il comportamento default del link
            e.preventDefault();

            // Navigazione basata sul tipo di click
            if (a.dataset.page) {
                // Click su numero di pagina specifico
                currentPage = parseInt(a.dataset.page);
            } else if (a.dataset.nav === "prev" && currentPage > 1) {
                // Click su "Previous" (se non siamo alla prima pagina)
                currentPage--;
            } else if (a.dataset.nav === "next" && currentPage < pagine) {
                // Click su "Next" (se non siamo all'ultima pagina)
                currentPage++;
            }

            // Aggiorna la visualizzazione con la nuova pagina
            updateContainer();
        };
    });
}

// ============================
// FUNZIONE: PERSONALIZZA IL MODAL DEI DETTAGLI
// ============================

/**
 * Personalizza e mostra il modal con i dettagli completi di un utente
 * @param {string} id - ID stabile dell'utente
 */
function personalizzaModal(id) {
    // Seleziona il modal dei dettagli utente
    const modal = document.querySelector("#utente");
    // Seleziona il titolo del modal
    const titolo = modal.querySelector(".modal-title");
    // Seleziona il corpo del modal
    const body = modal.querySelector(".modal-body");

    // Recupera la card corrispondente all'ID dalla mappa
    let card = existingCards.get(id);
    // Se la card non esiste, esce dalla funzione
    if (!card) return;

    // Estrae il nome utente dagli attributi data della card
    let username = card.dataset.name;

    // Seleziona il bottone elimina nel modal
    const modalBtnElimina = modal.querySelector(".btn-danger");

    // CORREZIONE: Rimuovi event listener precedenti clonando l'elemento
    // Questo previene la moltiplicazione degli event listener
    const newModalBtnElimina = modalBtnElimina.cloneNode(true);
    modalBtnElimina.parentNode.replaceChild(newModalBtnElimina, modalBtnElimina);

    // Configura il nuovo event listener per l'eliminazione
    newModalBtnElimina.onclick = () => {
        // Effettua la richiesta DELETE all'API
        fetch(`${baseurl}/users/${username}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
        })
        .then(response => {
            // Controlla se la risposta è positiva
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Rimuovi l'utente dalla lista globale
            allUsers = allUsers.filter(user => user.name !== username);
            // Rimuovi la card dalla mappa e dal DOM
            existingCards.delete(id);
            // Aggiorna la visualizzazione
            updateContainer();
            // Ricalcola il numero di pagine
            let npagine = Math.ceil(allUsers.length / usersPerPage);
            // Aggiorna la paginazione
            aggiornaPaginazione(npagine);
            // Chiudi il modal usando l'API Bootstrap
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        })
        .catch(err => {
            // Gestione errori nell'eliminazione
            console.error("Errore nell'eliminazione dell'utente:", err);
            alert("Errore nell'eliminazione dell'utente.");
        });
    }

    // Seleziona il bottone modifica nel modal
    const modalBtnModifica = modal.querySelector(".btn-secondary");
    
    // CORREZIONE: Rimuovi event listener precedenti clonando l'elemento
    const newModalBtnModifica = modalBtnModifica.cloneNode(true);
    modalBtnModifica.parentNode.replaceChild(newModalBtnModifica, modalBtnModifica);

    // Configura gli attributi per aprire il modal di modifica
    newModalBtnModifica.setAttribute("data-bs-toggle", "modal");
    newModalBtnModifica.setAttribute("data-bs-target", "#modificaUtenteModal");

    // Configura l'event listener per la modifica
    newModalBtnModifica.onclick = () => {
        // Chiude il modal corrente dei dettagli
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
        
        // Seleziona il modal di modifica
        const modalModifica = document.querySelector("#modificaUtenteModal");
        // Aggiorna il titolo del modal di modifica
        const titoloModifica = modalModifica.querySelector(".modal-title");
        titoloModifica.textContent = `Modifica utente: ${username}`;

        // PRECOMPILA I CAMPI DEL FORM CON I DATI ESISTENTI
        document.getElementById('m-username').value = username;
        // Trova l'utente corrente nella lista globale
        const user = allUsers.find(u => u.name === username);
        document.getElementById('m-eta').value = user.age;
        // Usa l'operatore di coalescenza nullish per valori di fallback
        document.getElementById('m-email').value = user.data?.email || "";
        document.getElementById('m-telefono').value = user.data?.phone || "";
        document.getElementById('m-immagine').value = user.data?.img || "";
        
        // Seleziona il bottone salva modifica
        const btnSalvaModifica = document.getElementById('btnSalvaModifica');

        // CORREZIONE: Rimuovi event listener precedenti clonando l'elemento
        const newBtnSalvaModifica = btnSalvaModifica.cloneNode(true);
        btnSalvaModifica.parentNode.replaceChild(newBtnSalvaModifica, btnSalvaModifica);

        // Configura l'event listener per salvare le modifiche
        newBtnSalvaModifica.onclick = function() {
            const form = document.getElementById('formModificaUtente');

            // VALIDAZIONE DEL FORM
            // Controlla se il form è valido secondo gli attributi HTML5
            if (!form.checkValidity()) {
                // Se non è valido, mostra gli errori di validazione
                form.classList.add('was-validated');
                return; // Interrompe l'esecuzione
            }

            // Prepara l'oggetto utente aggiornato
            const newUser = {
                name: document.getElementById('m-username').value,
                age: parseInt(document.getElementById('m-eta').value)
            };

            // AGGIUNGI CAMPI OPZIONALI SE PRESENTI
            const email = document.getElementById('m-email').value;
            const telefono = document.getElementById('m-telefono').value;
            const immagine = document.getElementById('m-immagine').value;

            // Gestione dell'immagine
            if (immagine) {
                // Inizializza l'oggetto data se non esiste
                newUser.data = newUser.data || {};
                newUser.data.img = immagine;
            }

            // Gestione dell'email
            if (email) {
                newUser.data = newUser.data || {};
                newUser.data.email = email;
            }

            // Gestione del telefono
            if (telefono) {
                newUser.data = newUser.data || {};
                newUser.data.phone = telefono;
            }

            // INVIA LA RICHIESTA PUT PER MODIFICARE L'UTENTE
            fetch(`${baseurl}/users/${username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(newUser)
            })
            .then(response => {
                // Controlla se la risposta è positiva
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Utente modificato con successo:', data);
                
                // AGGIORNA I DATI LOCALI
                // Sostituisce l'utente vecchio con quello nuovo nella lista globale
                allUsers = allUsers.map(user => user.name === username ? newUser : user);
                // Aggiorna l'interfaccia con i nuovi dati
                updateData(allUsers);

                // Chiude il modal di modifica
                const modal = bootstrap.Modal.getInstance(modalModifica);
                if (modal) {
                    modal.hide();
                }
                
                // CORREZIONE: Messaggio appropriato per la modifica
                alert('Utente modificato con successo!');
            })
            .catch(error => {
                // Gestione errori nella modifica
                console.error('Errore durante la modifica dell\'utente:', error);
                alert('Si è verificato un errore durante la modifica dell\'utente.');
            });
        };
    }

    // FETCH DEI DETTAGLI COMPLETI DELL'UTENTE
    // Recupera informazioni più dettagliate per il modal
    fetch(`${baseurl}/users/${username}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(user => {
            // Aggiorna il contenuto del modal con i dettagli completi
            titolo.textContent = user.name;
            // Usa l'operatore di coalescenza nullish per valori di fallback
            let email = user.data?.email ?? "//";
            let phone = user.data?.phone ?? "//";
            let immagine = user.data?.img ?? "Imgs/noImg.jpg";
            
            // Costruisce l'HTML per il corpo del modal
            body.innerHTML = `
                <p><strong>Nome:</strong> ${user.name}</p>
                <p><strong>Age:</strong> ${user.age}</p>
                <p><strong>Email: </strong> ${email}</p>
                <p><strong>Numero di cellulare: </strong> ${phone}</p>
                <img src="${immagine}" class="img-fluid" alt="${user.name}">
            `;
        })
        .catch(err => {
            // Gestione errori nel fetch dei dettagli
            console.error("Errore nel fetch dell'utente:", err);
            body.innerHTML = `<p>Errore nel caricamento dei dati.</p>`;
        });
}

// ============================
// AGGIUNGI UTENTE - FUNZIONALITÀ DI CREAZIONE
// ============================

// Seleziona il bottone per aprire il modal di aggiunta utente
const btn = document.getElementById('aggiungiUtente');

// Configura gli attributi del bottone
btn.setAttribute("type", "button");
btn.setAttribute("data-bs-toggle", "modal");
btn.setAttribute("data-bs-target", "#aggiungiUtenteModal");

// CORREZIONE: Variabile per prevenire setup multipli
let aggiungiUtenteSetup = false;

/**
 * Configura gli event listener per l'aggiunta di nuovi utenti
 * Viene eseguita una sola volta all'inizializzazione
 */
function setupAggiungiUtente() {
    // Se già configurato, esce per evitare duplicazioni
    if (aggiungiUtenteSetup) return;
    aggiungiUtenteSetup = true;

    // Seleziona il bottone salva nel modal di aggiunta
    const btnSalvaUtente = document.getElementById('btnSalvaUtente');

    // Configura l'event listener per il salvataggio
    btnSalvaUtente.onclick = function() {
        const form = document.getElementById('formAggiungiUtente');

        // VALIDAZIONE DEL FORM
        // Controlla la validità HTML5 del form
        if (!form.checkValidity()) {
            // Mostra gli errori di validazione
            form.classList.add('was-validated');
            return; // Interrompe l'esecuzione
        }

        // PREPARA I DATI DEL NUOVO UTENTE
        const newUser = {
            name: document.getElementById('username').value,
            age: parseInt(document.getElementById('eta').value)
        };

        // RACCOGLI I CAMPI OPZIONALI
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const immagine = document.getElementById('immagine').value;

        // GESTIONE CAMPI OPZIONALI
        // Inizializza l'oggetto data solo se almeno un campo opzionale è presente
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

        // CONTROLLO ESISTENZA UTENTE LOCALE
        // Verifica se un utente con lo stesso nome esiste già localmente
        const userExists = allUsers.some(user => 
            user.name.toLowerCase() === newUser.name.toLowerCase()
        );

        if (userExists) {
            alert('Errore: Un utente con questo username esiste già!');
            return; // Interrompe l'esecuzione
        }

        // INVIO RICHIESTA POST ALL'API
        fetch(`${baseurl}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(newUser)
        })
        .then(response => {
            // Gestione errori specifici dell'API
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
            
            // GESTIONE IMMAGINE DI DEFAULT
            // Se non è stata fornita un'immagine, usa quella di default
            if (!immagine){
                newUser.data = newUser.data || {};
                newUser.data.img = "Imgs/noImg.jpg";
            }
            
            // AGGIUNGI ALLA LISTA GLOBALE
            allUsers.push(newUser);
            
            // AGGIORNA LA VISUALIZZAZIONE
            const key = `${newUser.name}-${newUser.age}`;
        
            // CREA ID UNIVOCO SE NON ESISTE
            if (!userKeyMap.has(key)) {
                userKeyMap.set(key, generateId());
            }
            
            const id = userKeyMap.get(key);
            
            // CREA LA CARD DOM SOLO SE NON ESISTE
            if (!existingCards.has(id)) {
                const template = document.getElementById("user-card-template");
                const clone = template.content.cloneNode(true);
                const card = clone.querySelector(".col-12");
                const btn = card.querySelector(".btn");
                
                // Configura il bottone della card
                btn.className = "btn btn-primary";
                btn.innerText = "Maggiori informazioni";
                btn.setAttribute("type", "button");
                btn.setAttribute("data-bs-toggle", "modal");
                btn.setAttribute("data-bs-target", "#utente");
                btn.addEventListener('click', () => personalizzaModal(id));

                // Imposta gli attributi data
                card.dataset.id = id;
                card.dataset.name = newUser.name;
                card.dataset.age = newUser.age;
                
                // Imposta il contenuto della card
                card.querySelector(".card-title").textContent = newUser.name;
                card.querySelector(".card-text").textContent = `Age: ${newUser.age}`;
                card.querySelector("img").src = newUser.data.img;

                // Salva la card nella mappa
                existingCards.set(id, card);
            }

            // Aggiorna la visualizzazione
            updateContainer();
            
            // RICALCOLA LA PAGINAZIONE
            let npagine = Math.ceil(allUsers.length / usersPerPage);
            aggiornaPaginazione(npagine);
            
            // CHIUDI IL MODAL
            const modal = bootstrap.Modal.getInstance(document.getElementById('aggiungiUtenteModal'));
            if (modal) {
                modal.hide();
            }
            
            // RESET DEL FORM
            form.reset();
            form.classList.remove('was-validated');
            
            // MOSTRA MESSAGGIO DI SUCCESSO
            alert('Utente aggiunto con successo!');
        })
        .catch(error => {
            // GESTIONE ERRORI DETTAGLIATA
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
// INIZIALIZZAZIONE - AVVIO APPLICAZIONE
// ============================
/**
 * Funzione eseguita al caricamento della pagina
 * Inizializza l'applicazione e avvia i processi periodici
 */
window.onload = () => {
    // Recupera gli utenti all'avvio
    fetchUsers();
    // Configura gli event listener per l'aggiunta utente (una volta sola)
    setupAggiungiUtente();
    // Avvia il polling per aggiornamenti automatici ogni 5 secondi
    setInterval(fetchUsers, 5000);
};