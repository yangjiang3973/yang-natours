import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateData, updatePassword } from './updateSettings';
import { bookTour } from './stripe';

// DOM Elem
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordFrom = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// Delegation
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        e.preventDefault();
        login(email, password);
    });
}

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
    userDataForm.addEventListener('submit', (e) => {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        e.preventDefault();
        updateData(name, email);
    });
}

if (userPasswordFrom) {
    userPasswordFrom.addEventListener('submit', async (e) => {
        const currentPassword = document.getElementById('password-current');
        const newPassword = document.getElementById('password');
        const confirmPassowrd = document.getElementById('password-confirm');
        const btn = document.getElementById('btn-password');
        btn.textContent = 'Saving...';
        e.preventDefault();
        await updatePassword(
            currentPassword.value,
            newPassword.value,
            confirmPassowrd.value
        );
        btn.textContent = 'Save password';
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassowrd.value = '';
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', async (e) => {
        e.target.textContent = 'Processing...';
        const tourId = e.target.dataset.tourId;
        await bookTour(tourId);
        e.target.textContent = 'Book tour now!';
    });
}
