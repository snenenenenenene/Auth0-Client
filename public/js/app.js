
let auth0 = null;

const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    audience: config.audience   // NEW - add the audience value
  });
};

  const login = async () => {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin
    });
  };
  
  const logout = () => {
    auth0.logout({
      returnTo: window.location.origin
    });
  };

  const fetchApi = async () => {
    try {
  
      // Get the access token from the Auth0 client
      const token = await auth0.getTokenSilently();
  
      // Make the call to the API, setting the token
      // in the Authorization header
      const response = await fetch("/api/external", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Fetch the JSON result
      const responseData = await response.json();
  
      // Display the result in the output element
      const responseElement = document.getElementById("api-fetch-result");
      responseElement.innerText = JSON.stringify(responseData, null, 2);  
  } catch (e) {
      // Display errors in the console
      console.error(e);
    }
  };

window.onload = async () => {
    await configureClient();
  
    updateUI();

    const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    await auth0.handleRedirectCallback();
    
    updateUI();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
  }
};
  
const updateUI = async () => {
    const isAuthenticated = await auth0.isAuthenticated();
  
    document.getElementById("btn-logout").disabled = !isAuthenticated;
    document.getElementById("btn-login").disabled = isAuthenticated;


    if (isAuthenticated) {

        document.getElementById("btn-fetch-api").classList.remove("hidden");

        document.getElementById("gated-content").classList.remove("hidden");
    
        document.getElementById(
          "ipt-access-token"
        ).innerHTML = await auth0.getTokenSilently();
    
        document.getElementById("ipt-user-profile").textContent = JSON.stringify(
          await auth0.getUser()
        );
    
      } else {
        document.getElementById("gated-content").classList.add("hidden");
      }
};