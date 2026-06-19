const API_URL = "http://localhost:5678/api";

const loginForm = document.querySelector("#login-form");
const errorMessage = document.querySelector(".error-message");

loginForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	errorMessage.textContent = "";

	const user = {
		email: document.querySelector("#email").value,
		password: document.querySelector("#password").value,
	};

	try {
		const response = await fetch(`${API_URL}/users/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(user),
		});

		if (!response.ok) {
			errorMessage.textContent = "E-mail ou mot de passe incorrect.";
			return;
		}

		const data = await response.json();
		localStorage.setItem("token", data.token);

		window.location.href = "index.html";
	} catch (error) {
		errorMessage.textContent = "Une erreur est survenue, veuillez réessayer.";
		console.error(error);
	}
});
