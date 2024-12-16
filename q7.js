function time(){
    const now = new Date();
    document.getElementById("timer").textContent=now.toLocaleString();
}


function checkLoginStatusAndUpdateInfo() {
    let isLoggedIn = getCookie('isLoggedIn');
    let username = getCookie('username');

    console.log('isLoggedIn:', isLoggedIn); 
    console.log('username:', username); 

    if (isLoggedIn === 'true') {
        document.getElementById('loginInfo').textContent = `Welcome, ${username}! You are currently logged on.`;
        document.getElementById('loginInfo').style.color = "white";
    } else {
        document.getElementById('loginInfo').textContent = "Welcome, guest! You are not logged in yet.";
        document.getElementById('loginInfo').style.color = "black";
    }
}

function getCookie(cookieName) {
    let name = cookieName + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(';');
    
    for(let i = 0; i < cookieArray.length; i++) {
        let c = cookieArray[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


