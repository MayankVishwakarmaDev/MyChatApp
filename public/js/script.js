//------------------ document elements ---------------
const loader = `<span class='loader'><span class='loader__dot'></span><span class='loader__dot'></span><span class='loader__dot'></span></span>`;
const errorMessage =
  "My apologies, I'm not available at the moment, however, feel free to call our support team directly.";

const $document = document;
const $chatbot = $document.querySelector(".chatbot");
const $chatbotMessageWindow = $document.querySelector(
  ".chatbot__message-window"
);
const $chatbotHeader = $document.querySelector(".chatbot__header");
const $chatbotMessages = $document.querySelector(".chatbot__messages");
const $chatbotInput = $document.querySelector(".chatbot__input");
const $chatbotSubmit = $document.querySelector(".chatbot__submit");
const $leaveButton = $document.getElementById("leave");

const botLoadingDelay = 0; //1000;
const botReplyDelay = 0; //2000;

// ------------- Confirm Model ------------------

const showConfirmBox = (
  message,
  onConfirmation = () => {},
  onCancelation = () => {},
  onClose = () => {}
) => {
  const confirmBoxHTML = `<div class="modal-container confirm-modal-container show" id="confirm_modal_container">
      <div class="modal confirm-modal">
          <div class="confirm-box">
              <div>${message}</div>
              <svg class="chatbot__close-button icon-close" id="close" viewBox="0 0 32 32">
              <use xlink:href="#icon-close" />
              </svg>
          </div>
          <div class="confirm-btn">
              <button id="confirm" class="confirm-yes" autofocus>Yes</button>
              <button id="cancel" class="confirm-no">No</button>
          </div>
      </div></div>`;

  const confirmBox = $document.createElement("div");
  confirmBox.innerHTML = confirmBoxHTML;
  $document.body.appendChild(confirmBox);

  const confirmModalContainerEl = $document.getElementById(
    "confirm_modal_container"
  );
  const confirmbtnEl = $document.getElementById("confirm");
  confirmbtnEl.addEventListener("click", () => {
    onConfirmation();
    confirmModalContainerEl.remove();
  });

  const cancelbtnEl = $document.getElementById("cancel");
  cancelbtnEl.addEventListener("click", () => {
    onCancelation();
    confirmModalContainerEl.remove();
  });

  const closebtnEl = $document.getElementById("close");
  closebtnEl.addEventListener("click", () => {
    onClose();
    confirmModalContainerEl.remove();
  });
};

//----------------------------------------------------

const toggle = (element, className) => {
  const classes = element.className.match(/\S+/g) || [],
    index = classes.indexOf(className);
  index >= 0 ? classes.splice(index, 1) : classes.push(className);
  element.className = classes.join(" ");
};

const userMessage = (content) => {
  $chatbotMessages.innerHTML += `<li class='is-user animation'>
      <div class='chatbot__message'>
            <div class="chat-info">
                <div class="username">${content.userName}</div>
                <div class="time-stamp">${content.time}</div>
            </div>
        ${content.message}
      </div>
      <span class='chatbot__arrow chatbot__arrow--right'></span>
    </li>`;
};

const aiMessage = (content, isLoading = false, delay = 0) => {
  setTimeout(() => {
    removeLoader();
    $chatbotMessages.innerHTML += `
    <li class='is-ai animation' id='${isLoading ? "is-loading" : ""}'>
        <span class='chatbot__arrow chatbot__arrow--left'></span>
        <div class='chatbot__message'>
            <div class="chat-info">
                <div class="username">${content.userName}</div>
                <div class="time-stamp">${content.time}</div>
            </div>

            ${content.message}
        </div>
      </li>`;
    scrollDown();
  }, delay);
};

const removeLoader = () => {
  let loadingElem = document.getElementById("is-loading");
  if (loadingElem) loadingElem.remove();
  console.log("called");
};

const escapeScript = (unsafe) => {
  const safeString = unsafe
    .replace(/</g, " ")
    .replace(/>/g, " ")
    .replace(/&/g, " ")
    .replace(/"/g, " ")
    .replace(/\\/, " ")
    .replace(/\s+/g, " ");
  return safeString.trim();
};

const validateMessage = () => {
  const text = $chatbotInput.value;
  const safeText = text ? escapeScript(text) : "";
  if (safeText.length && safeText !== " ") {
    resetInputField();

    const userChat = createResponse(safeText);
    userMessage(userChat);
    send(safeText);
  }
  scrollDown();
  return;
};

const setResponse = (val, delay = 0) => {
  setTimeout(() => {
    aiMessage(val);
  }, delay);
};

const resetInputField = () => {
  $chatbotInput.value = "";
};

const scrollDown = () => {
  const distanceToScroll =
    $chatbotMessageWindow.scrollHeight -
    ($chatbotMessages.lastChild.offsetHeight + 60);
  $chatbotMessageWindow.scrollTop = distanceToScroll;
  return false;
};

const getIpAddress = async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    sessionStorage.setItem("ipAddress", data.ip);
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return null;
  }
};

const createResponse = (message) => {
  const currentTime = getCurrentTime();
  return {
    userName: sessionStorage.getItem("userName"),
    message: message,
    code: sessionStorage.getItem("connectionCode"),
    time: currentTime,
    ip: sessionStorage.getItem("ipAddress"),
  };
};

const validateUser = () => {
  if (
    !sessionStorage.getItem("userName") &&
    !sessionStorage.getItem("connectionCode")
  ) {
    modalContainerEl.classList.add("show");
  } else {
    leaveChat();
    showConfirmBox(
      "You have reloaded the chat do you want to rejoin the chat.",
      rejoinChat,
      clearSession,
      clearSession
    );
  }
};

const getCurrentTime = () => {
  const date = new Date();
  const period = date.getHours() > 12 ? "PM" : "AM";

  let currentHours =
    date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
  currentHours = (currentHours < 10 ? "0" : "") + currentHours;

  let currentMinutes = date.getMinutes();
  currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;

  const currentTime = `${currentHours}:${currentMinutes} ${period}`;

  return currentTime;
};

const send = (text = "") => {
  const sendMessage = createResponse(text);
  socket.emit("userMessage", sendMessage);
  // aiMessage(loader, true, botLoadingDelay); to run loader
};

const sendNotification = (title) => {
  function notification() {
    Push.create(title, {
      timeout: 1000,
    });
  }

  if (Push.Permission.has()) {
    notification();
  } else {
    Push.Permission.request(notification, () => {});
  }
};

const rejoinChat = () => {
  const rejoinedChat = createResponse(
    `${sessionStorage.getItem("userName").toUpperCase()} Rejoined the chat`
  );
  socket.emit("Rejoined", rejoinedChat);
  userMessage(
    createResponse(`You Rejoined the chat`),
    botLoadingDelay + botReplyDelay
  );
};

const leaveChat = () => {
  const leftContent = createResponse(
    `${sessionStorage.getItem("userName").toUpperCase()} Left the chat`
  );
  socket.emit("left", leftContent);
};

const clearSession = () => {
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("connectionCode");
  validateUser();
};

// ------------- Model --------------------------------

const modalContainerEl = document.getElementById("modal_container");
const form = document.getElementById("modal-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  sessionStorage.setItem("userName", e.target[0].value);
  sessionStorage.setItem("connectionCode", e.target[1].value);

  const content = createResponse(
    `${sessionStorage.getItem("userName").toUpperCase()} Joined the chat`
  );

  socket.emit("joined", content);
  userMessage(
    createResponse(
      `You Joined Chat with Room code : ${sessionStorage.getItem(
        "connectionCode"
      )} as ${sessionStorage.getItem("userName")}`
    ),
    botLoadingDelay + botReplyDelay
  );
  modalContainerEl.classList.remove("show");
});
//-----------------------------------------------------

//----------------- socket ----------------------------
const socket = io();

socket.on("serverMessage", (data) => {
  if (data.code == sessionStorage.getItem("connectionCode")) {
    setResponse(data, botLoadingDelay + botReplyDelay);
  }
});

socket.on("joinedMessage", (data) => {
  if (data.code == sessionStorage.getItem("connectionCode")) {
    sendNotification(data.message);
    setResponse(data, botLoadingDelay + botReplyDelay);
  }
});

socket.on("leftMessage", (data) => {
  if (data.code == sessionStorage.getItem("connectionCode")) {
    sendNotification(data.message);
    setResponse(data, botLoadingDelay + botReplyDelay);
  }
});

socket.on("typingChat", (data) => {
  if (data.code == sessionStorage.getItem("connectionCode")) {
    if (data.status && data.status != null) {
      const response = { ...createResponse(loader), userName: data.userName };
      aiMessage(response, true, botLoadingDelay);
    } else {
      removeLoader();
    }
  }
});

//-----------------------------------------------------

//---------------- Event Listeners -------------------

let timer; //fro typing status
const waitTime = 1000; // typing wait time
let typingStatus = true; // for typing status

window.addEventListener("load", () => {
  getIpAddress();
  validateUser();
});

document.addEventListener(
  "keypress",
  (event) => {
    if (event.which == 13) validateMessage();
  },
  false
);

$chatbotSubmit.addEventListener(
  "click",
  () => {
    validateMessage();
  },
  false
);

$leaveButton.addEventListener("click", () => {
  showConfirmBox("Are you sure you want to leave the chat.", () => {
    leaveChat();
    clearSession();
  });
});

$chatbotInput.addEventListener("keyup", (event) => {
  clearTimeout(timer);
  if (typingStatus) {
    socket.emit("typing", {
      userName: sessionStorage.getItem("userName"),
      status: true,
      code: sessionStorage.getItem("connectionCode"),
    });
    typingStatus = false;
  }

  timer = setTimeout(() => {
    socket.emit("typing", {
      status: false,
      code: sessionStorage.getItem("connectionCode"),
    });
    typingStatus = true;
  }, waitTime);
});

//----------------------------------------------------
