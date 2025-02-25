import { auth, sendPasswordResetEmail } from "./logic.js";

document.addEventListener('DOMContentLoaded', () => {
  const sendEmailCode = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
      // window.location.replace('./index.html');
    } catch (error) {
      console.error(error.code, error.message);
      // Additional error handling can go here.
    }
  };

  const resetBtn = document.querySelector('#forget-password-btn');
  const emailInput = document.querySelector('#email-input-forget');

  if (!resetBtn || !emailInput) {
    console.error('Required elements not found in the DOM.');
    return;
  }

  resetBtn.addEventListener('click', () => {
    const emailCode = emailInput.value.trim();
    if (emailCode === "") {
      alert("Please enter your email address.");
      return;
    }
    sendEmailCode(emailCode);
  });
});
