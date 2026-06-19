
const API_URL = "http://localhost:5678/api";

const gallery = document.querySelector(".gallery");
const filtersContainer = document.querySelector(".filters");

let allWorks = [];
let allCategories = [];


// Récupère la liste des travaux depuis l'API
async function getWorks() {
	const response = await fetch(`${API_URL}/works`);

	if (!response.ok) {
		throw new Error(`Erreur lors de la récupération des travaux : ${response.status}`);
	}

	return response.json();
}

// Récupère la liste des catégories depuis l'API
async function getCategories() {
	const response = await fetch(`${API_URL}/categories`);

	if (!response.ok) {
		throw new Error(`Erreur lors de la récupération des catégories : ${response.status}`);
	}

	return response.json();
}


// Crée et ajoute un travail dans la galerie
function displayWork(work) {
	const figure = document.createElement("figure");
	const img = document.createElement("img");
	const figcaption = document.createElement("figcaption");

	img.src = work.imageUrl;
	img.alt = work.title;
	figcaption.textContent = work.title;


	figure.appendChild(img);
	figure.appendChild(figcaption);

	gallery.appendChild(figure);
}


// Vide la galerie puis affiche l'ensemble des travaux fournis
function displayWorks(works) {
	gallery.innerHTML = "";
	works.forEach(displayWork);
}

// Crée un bouton de filtre qui affiche les travaux de la catégorie au clic
function createFilterButton(label, categoryId) {
	const button = document.createElement("button");
	button.classList.add("filter-btn");
	button.textContent = label;

	button.addEventListener("click", () => {
		document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
		button.classList.add("active");

		if (categoryId === 0) {
			displayWorks(allWorks);
		} else {
			displayWorks(allWorks.filter((work) => work.categoryId === categoryId));
		}
	});

	return button;
}

// Affiche le bouton « Tous » et un bouton de filtre par catégorie
function displayFilters(categories) {
	const allButton = createFilterButton("Tous", 0);
	allButton.classList.add("active");
	filtersContainer.appendChild(allButton);

	categories.forEach((category) => {
		filtersContainer.appendChild(createFilterButton(category.name, category.id));
	});
}

// Retourne le token d'authentification stocké dans le localStorage
function getToken() {
	return localStorage.getItem("token");
}

// Vérifie qu'un token valide et non expiré est présent
function isLoggedIn() {
	const token = getToken();
	if (!token) return false;

	try {
		const payloadBase64 = token.split(".")[1];
		if (!payloadBase64) return false;

		const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
		const payload = JSON.parse(atob(base64));

		if (payload.exp && Date.now() >= payload.exp * 1000) {
			return false;
		}

		return true;
	} catch (error) {
		return false;
	}
}

// Affiche le bandeau « Mode édition » en haut de la page
function displayEditBanner() {
	const banner = document.createElement("div");
	banner.classList.add("edit-banner");
	banner.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> Mode édition';
	document.body.prepend(banner);
}

// Transforme le lien « login » en « logout » et gère la déconnexion
function setupLogout() {
	const loginLink = document.querySelector("#login-link");
	loginLink.textContent = "logout";
	loginLink.href = "#";
	loginLink.addEventListener("click", (event) => {
		event.preventDefault();
		localStorage.removeItem("token");
		window.location.reload();
	});
}

// Ajoute le bouton « modifier » qui ouvre la modale d'édition
function displayEditButton() {
	const portfolioHeader = document.querySelector(".portfolio-header");
	const editButton = document.createElement("button");
	editButton.classList.add("edit-button");
	editButton.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> modifier';
	editButton.addEventListener("click", openModal);
	portfolioHeader.appendChild(editButton);
}

// Active l'interface administrateur
function enableAdminMode() {
	displayEditBanner();
	setupLogout();
	filtersContainer.style.display = "none";
	displayEditButton();
	setupModal();
}

const modal = document.querySelector("#modal");
const galleryView = document.querySelector("#modal-gallery-view");
const addView = document.querySelector("#modal-add-view");

// Ouvre la modale sur la vue galerie
function openModal() {
	displayModalGallery();
	showGalleryView();
	modal.style.display = "flex";
	modal.setAttribute("aria-hidden", "false");
}

// Ferme la modale et réinitialise le formulaire d'ajout
function closeModal() {
	modal.style.display = "none";
	modal.setAttribute("aria-hidden", "true");
	resetAddForm();
}

// Affiche la vue galerie de la modale
function showGalleryView() {
	addView.style.display = "none";
	galleryView.style.display = "flex";
}

// Affiche la vue d'ajout de photo de la modale
function showAddPhotoView() {
	galleryView.style.display = "none";
	addView.style.display = "flex";
}

// Affiche les travaux dans la modale avec un bouton de suppression
function displayModalGallery() {
	const modalGallery = document.querySelector(".modal-gallery");
	modalGallery.innerHTML = "";

	allWorks.forEach((work) => {
		const figure = document.createElement("figure");

		const img = document.createElement("img");
		img.src = work.imageUrl;
		img.alt = work.title;

		const deleteButton = document.createElement("button");
		deleteButton.classList.add("delete-work");
		deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
		deleteButton.addEventListener("click", () => deleteWork(work.id));

		figure.appendChild(img);
		figure.appendChild(deleteButton);
		modalGallery.appendChild(figure);
	});
}

// Supprime un travail via l'API puis met à jour les galeries
async function deleteWork(id) {
	try {
		const response = await fetch(`${API_URL}/works/${id}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${getToken()}` },
		});

		if (!response.ok) {
			throw new Error(`Erreur lors de la suppression : ${response.status}`);
		}

		allWorks = allWorks.filter((work) => work.id !== id);
		displayWorks(allWorks);
		displayModalGallery();
	} catch (error) {
		console.error(error);
	}
}

// Remplit la liste déroulante des catégories du formulaire d'ajout
function displayCategoryOptions() {
	const select = document.querySelector("#category");
	select.innerHTML = '<option value=""></option>';

	allCategories.forEach((category) => {
		const option = document.createElement("option");
		option.value = category.id;
		option.textContent = category.name;
		select.appendChild(option);
	});
}

// Vérifie que l'image, le titre et la catégorie sont renseignés
function isFormValid() {
	const image = document.querySelector("#image").files[0];
	const title = document.querySelector("#title").value.trim();
	const category = document.querySelector("#category").value;
	return Boolean(image) && title !== "" && category !== "";
}

// Active ou désactive le bouton de validation selon l'état du formulaire
function updateSubmitState() {
	const submitButton = document.querySelector(".submit-btn");
	submitButton.classList.toggle("active", isFormValid());
}

// Réinitialise le formulaire d'ajout et son aperçu d'image
function resetAddForm() {
	const form = document.querySelector("#add-photo-form");
	form.reset();

	const preview = document.querySelector("#image-preview");
	preview.hidden = true;
	preview.removeAttribute("src");

	document.querySelector(".upload-placeholder").hidden = false;
	document.querySelector(".form-error").textContent = "";
	updateSubmitState();
}

// Affiche l'aperçu de l'image sélectionnée par l'utilisateur
function handleImageChange() {
	const file = document.querySelector("#image").files[0];
	if (!file) return;

	const preview = document.querySelector("#image-preview");
	preview.src = URL.createObjectURL(file);
	preview.hidden = false;
	document.querySelector(".upload-placeholder").hidden = true;

	updateSubmitState();
}

// Envoie le formulaire à l'API puis met à jour les galeries
async function handleAddPhotoSubmit(event) {
	event.preventDefault();
	const formError = document.querySelector(".form-error");
	formError.textContent = "";

	if (!isFormValid()) {
		formError.textContent = "Veuillez remplir tous les champs.";
		return;
	}

	const formData = new FormData();
	formData.append("image", document.querySelector("#image").files[0]);
	formData.append("title", document.querySelector("#title").value.trim());
	formData.append("category", document.querySelector("#category").value);

	try {
		const response = await fetch(`${API_URL}/works`, {
			method: "POST",
			headers: { Authorization: `Bearer ${getToken()}` },
			body: formData,
		});

		if (!response.ok) {
			formError.textContent = "Erreur lors de l'envoi du projet.";
			return;
		}

		const newWork = await response.json();
		allWorks.push(newWork);
		displayWorks(allWorks);
		displayModalGallery();

		resetAddForm();
		showGalleryView();
	} catch (error) {
		formError.textContent = "Une erreur est survenue. Veuillez réessayer.";
		console.error(error);
	}
}

// Initialise la modale : catégories et listener d'event
async function setupModal() {
	try {
		allCategories = await getCategories();
		displayCategoryOptions();
	} catch (error) {
		console.error(error);
	}

	document.querySelectorAll(".js-modal-close").forEach((button) => {
		button.addEventListener("click", closeModal);
	});

	modal.addEventListener("click", (event) => {
		if (event.target === modal) closeModal();
	});

	document.querySelector(".js-open-add").addEventListener("click", showAddPhotoView);
	document.querySelector(".js-modal-back").addEventListener("click", showGalleryView);

	document.querySelector("#image").addEventListener("change", handleImageChange);
	document.querySelector("#title").addEventListener("input", updateSubmitState);
	document.querySelector("#category").addEventListener("change", updateSubmitState);
	document.querySelector("#add-photo-form").addEventListener("submit", handleAddPhotoSubmit);
}

//charge les travaux et active le mode administrateur ou les filtres au chargementde la page
async function init() {
	try {
		allWorks = await getWorks();
		displayWorks(allWorks);

		if (isLoggedIn()) {
			enableAdminMode();
		} else {
			const categories = await getCategories();
			displayFilters(categories);
		}
	} catch (error) {
		console.error(error);
	}
}

init();
