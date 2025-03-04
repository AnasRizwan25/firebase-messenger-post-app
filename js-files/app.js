import { signInWithEmailAndPassword, addDoc, collection, db, onAuthStateChanged, auth, signInWithPopup, GoogleAuthProvider } from "./logic.js";

let islogin = localStorage.getItem('login')

let play = localStorage.getItem('player')

if (play) {
  window.location.replace('./input.html')
}


if (islogin) {
  window.location.replace('./dashboard.html')
}

const provider = new GoogleAuthProvider();



document.querySelector('#log-btn').addEventListener(('click'), async () => {
  let emailValue = document.querySelector('#emailValue').value;
  let passValue = document.querySelector('#passValue').value;

  await signInWithEmailAndPassword(auth, emailValue, passValue)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    console.log("sign in succesfully")
    localStorage.setItem('login', user.uid)
    window.location.replace("./dashboard.html");
    document.querySelector('.js-alert-box-main').style.display = 'none';
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage)
      document.getElementById("closeBtn").addEventListener("click", function () {
        document.querySelector(".js-alert-box-main").style.display = "none";
      });
      document.querySelector('.js-alert-box-main').style.display = 'flex';
    });
})

let emailInput = false;
let passInput = false;



function loginForm(value, e) {

  let email = document.querySelector('#email-id');
  let pass = document.querySelector('#pass-id');

  if (value === 'email') {
    if (e.target.value.indexOf('@') === -1) {
      email.style.display = 'block';
      emailInput = false;
    } else {
      email.style.display = 'none';
      emailInput = true;
    }
  }
  if (value === 'password') {
    if (e.target.value.length < 10) {
      pass.style.display = 'block';
      passInput = false;
    } else {
      pass.style.display = 'none';
      passInput = true;
    }
  }
}



let flag = true;
function visiblePass(e) {

  let element = e.target.previousElementSibling;

  if (element.getAttribute('type') === 'password' && flag) {
    element.setAttribute('type', 'text');
    flag = false;
    return;
  }
  element.setAttribute('type', 'password');
  flag = true;
  
}




document.querySelector("#google-signUp").addEventListener('click',() => {
  signInWithPopup(auth, provider)
  .then(async(result) => {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    const docRef = await addDoc(collection(db, "users"), {
        email: user.email,
        uid: user.uid,
        photoURL: user.photoURL,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
      })
      console.log('user:Successfully login');
      localStorage.setItem('login', user.uid)
      window.location.replace('./dashboard.html');
    }).catch((error) => {
      const errorMessage = error.message;
      console.error(errorMessage);
    });
  });
  
  
  
  
  let checkUser = async () => {
  try {
    await onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log(user);
        // ...
      } else {
        // User is signed out
        console.log("signed out");
        // ...
      }
    });
  } catch (error) {
    console.error(error);
  }
};

checkUser();

document.querySelector(".em1").addEventListener('input', (event) => {
  loginForm('email', event);
});

document.querySelector(".ps1").addEventListener('input', (event) => {
  loginForm('password', event);
});

document.querySelector("#img1").addEventListener('click', (event) => {
  visiblePass(event);
});



