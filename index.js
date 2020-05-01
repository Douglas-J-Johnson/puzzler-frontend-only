const BASE_PATH = "http://localhost:3000"
const USER_PATH = `${BASE_PATH}/users`
const LOGIN_PATH = `${BASE_PATH}/login`
const PUZZLE_PATH = `${BASE_PATH}/puzzles`
//const CHALLENGE_PATH = `${BASE_PATH}/challenges`
const BEARER = 'Bearer '

const dynamicStyles = document.getElementById('dynamic-styles')

// General Layout
const headerHeight = 100
const footerHeight = 75

// Login state selection
const signup = document.getElementById('signup-select')
const login = document.getElementById('login-select')
const logout = document.getElementById('logout-select')
const puzzler = document.getElementById('puzzler')
signup.addEventListener('click',loginActionSelect)
login.addEventListener('click',loginActionSelect)
logout.addEventListener('click',loginActionSelect)

// Signup Form
const signupForm = document.getElementById('signup-form')
signupForm.addEventListener('submit', signupSubmit)
const signupFormUserName = document.getElementById('signup-username')
const signupFormPassword = document.getElementById('signup-password')
const signupFormUserNameConfirm = document.getElementById('signup-username-confirm')
const signupFormPasswordConfirm = document.getElementById('signup-password-confirm')
const signupMessages = document.getElementById('signup-messages')

// Login Form
const loginForm = document.getElementById('login-form')
loginForm.addEventListener('submit', loginSubmit)
const loginFormUserName = document.getElementById('login-username')
const loginFormPassword = document.getElementById('login-password')
const loginMessages = document.getElementById('login-messages')

// Game Generation Form
const generateForm = document.getElementById('generate-form')
const generateRandomSelect = document.getElementById('generate-random-select')
const generateSpecifySelect = document.getElementById('generate-specify-select')
const generateRows = document.getElementById('generate-rows')
generateRows.addEventListener('change',updateRowsLabel)
const generateRowsLabel = document.getElementById('generate-rows-label')
const generateColumns = document.getElementById('generate-columns')
generateColumns.addEventListener('change',updateColumnsLabel)
const generateColumnsLabel = document.getElementById('generate-columns-label')
const generateThemes= document.getElementById('generate-themes')
const generateFilePath = document.getElementById('generate-file-path')
generateRandomSelect.addEventListener('click', generateOptionSelect)
generateSpecifySelect.addEventListener('click', generateOptionSelect)
generateForm.addEventListener('submit', generateBoard)

// Game Content
let startTime = 0
const boardBorder = 50
const game = document.getElementById('game')
const referenceImage = document.getElementById('reference-image')
const completedImage = document.getElementById('completed-image')
const gameBoard = document.getElementById('game-board')
const newPuzzleSelect = document.getElementById('new-puzzle-select')
newPuzzleSelect.addEventListener('click', changePuzzle)
const savePuzzleSelect = document.getElementById('save-puzzle-select')
savePuzzleSelect.addEventListener('click', savePuzzle)
const deletePuzzleSaveSelect = document.getElementById('delete-puzzle-save-select')
deletePuzzleSaveSelect.addEventListener('click', deletePuzzleSave)

function deleteAllChildren(element) {
    for(let i=element.childElementCount-1; i>=0; i--) {
        element.removeChild(element.childNodes[i])
    }
}

function changePuzzle() {
    location.reload()
    setState()
}

function gatherState() {
    const imagePath = localStorage.getItem('image_master_url')
    const id = localStorage.getItem('puzzle_id')
    const cardStyles = dynamicStyles.innerText
    let cardMap = {}
    let correct = 0

    for (let i = 1; i<=cardCount; i++) {
        const card = document.getElementById(`card-${i}`)
        const location = card.parentElement
        cardMap[location.dataset.id] = card.dataset.id
        if(location.dataset.id == card.dataset.id) {
            correct = correct + 1
        }
    }
    const percentCorrect = Math.floor((correct/cardCount)*100)
    const elapsedTime = Number(Date.now())-startTime
    let completionStatus = false
    if (checkForCompleteness()) {
        completionStatus = true
    }

    const state = {
        id:id,
        image_path: imagePath,
        rows: rows,
        columns: columns,
        card_map: '',
        card_styles: cardStyles,
        elapsed_time: elapsedTime,
        percent_correct: percentCorrect,
        completion_status: completionStatus}

    return state
}

function savePuzzle() {
    const token = localStorage.getItem('token')
    const puzzle = gatherState()
    const id = puzzle.id

    if (id == '' || id == null) {
        console.log("Save Data")
    
        fetch(PUZZLE_PATH, {method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
        body: JSON.stringify({puzzle})
        })
        .then(response => {
            const responseOK =  response.ok
            response.json().then(responseBody=>{
                if (responseOK) {
                    puzzle_id = responseBody.puzzle.id
                    localStorage.setItem('puzzle_id', puzzle_id)
                    deletePuzzleSaveSelect.classList.remove('item-inactive')
                    console.log(`Save Successful ${puzzle_id}`)

                }
            })
        })
    }
    else {
        console.log("Update Saved Data")
        fetch(`${PUZZLE_PATH}/${id}`, {method: "PUT",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
        body: JSON.stringify({puzzle})
        })
        .then(response => {
            const responseOK =  response.ok
            response.json().then(responseBody=>{
                if (responseOK) {
                    console.log(`${id} Update Successful`)
                }
            })
        })
    } 
}

function deletePuzzleSave() {
    const puzzle_id = localStorage.getItem('puzzle_id')
    const token = localStorage.getItem('token')

    if (puzzle_id == '' || puzzle_id == null) {
        alert('Puzzle save cannot be deleted, because no save can be found')
    }
    else {
        console.log('Delete Saved Data')
        fetch(`${PUZZLE_PATH}/${puzzle_id}`, {method: 'DELETE',
        headers: {
            'Authorization': `${token}`
          }        
        })
        .then(response => {
            const responseOK =  response.ok
            response.json().then(responseBody=>{
                if (responseOK) {
                    localStorage.setItem('puzzle_id', '')
                    deletePuzzleSaveSelect.classList.add('item-inactive')
                    console.log(`${puzzle_id} Delete Successful`)
                }
            })
        })
    }
}

// function saveChallenge() {
//     let state = gatherState()

//     fetch(CHALLENGE_PATH, {
//         method: 'POST',

//         body: JSON.stringify({state.imagePath, state.rows, state.columns, state.elapsedTime})
//     })
//     .then()
// }

// function deleteChallenge(id) {
//     fetch(`${CHALLENGE_PATH}/${id}`, { method: 'DELETE' })
//         .then()
// }

function initializeLocalStorage() {
    const token = localStorage.getItem('token')
    localStorage.clear()
    localStorage.setItem('token', token)
}

function setState() {
    initializeLocalStorage()
    const token = localStorage.getItem('token')

    if (token == '' || token == null) {
        puzzler.classList.add('puzzler-logged-out')
        puzzler.classList.remove('puzzler-logged-in')
        signup.style.display = 'inline-block'
        signup.classList.remove('item-selected')
        login.style.display = 'inline-block'
        login.classList.remove('item-selected')
        logout.style.display = 'none'
        signupForm.style.display = 'none'
        loginForm.style.display = 'none'
        generateForm.style.display = 'none'
        game.style.display = 'none'
    }
    else {
        puzzler.classList.add('puzzler-logged-in')
        puzzler.classList.remove('puzzler-logged-out')
        generateRandomSelect.style.display = 'inline-block'
        generateRandomSelect.classList.add('item-selected')
        generateForm.dataset.mode = 'random'
        generateSpecifySelect.style.display = 'inline-block'
        generateFilePath.style.display = 'none'
        signup.style.display = 'none'
        login.style.display = 'none'
        logout.style.display = 'inline-block'
        signupForm.style.display = 'none'
        loginForm.style.display = 'none'
        generateForm.style.display = 'block'
        generateForm.style.display = 'flex'
        game.style.display = 'none'
        updateColumnsLabel()
        updateRowsLabel()
    }
}

function clearSignupForm() {
    signupFormUserName.value = ""
    signupFormPassword.value = ""
    while (signupMessages.children.length > 0) {
        signupMessages.removeChild(signupMessages.childNodes[0])
    }
}

function clearLoginForm() {
    loginFormUserName.value = ""
    loginFormPassword.value = ""
    while (loginMessages.children.length > 0) {
        loginMessages.removeChild(loginMessages.childNodes[0])
    }
}

function clearSignupLoginForms() {
    clearSignupForm()
    clearLoginForm()
}

function signupSubmit (event) {
    event.preventDefault()
    const username = signupFormUserName.value
    const password = signupFormPassword.value
    const usernameConfirm = signupFormUserNameConfirm.value
    const passwordConfirm = signupFormPasswordConfirm.value
    const user = {user: {username: username, password: password}}
    const checksFailed = false

    clearSignupLoginForms()

    if (username != usernameConfirm) {
        checksFailed = true
        const signupMessageElement = document.createElement('li')
        signupMessageElement.innerText = "User Name did not match when re-entered."
        signupMessageElement.classList.add('message')
        signupMessageElement.classList.add('message-warning')
        signupMessages.append(signupMessageElement)
    }

    if (password != passwordConfirm) {
        checksFailed = true
        const signupMessageElement = document.createElement('li')
        signupMessageElement.innerText = "Password did not match when re-entered."
        signupMessageElement.classList.add('message')
        signupMessageElement.classList.add('message-warning')
        signupMessages.append(signupMessageElement)
    }
    
    if (username == '' || password == '' || usernameConfirm == '' || passwordConfirm == '') {
        checksFailed = true
        const signupMessageElement = document.createElement('li')
        signupMessageElement.innerText = "You must specify both a user name and password and confirm the value of both."
        signupMessageElement.classList.add('message')
        signupMessageElement.classList.add('message-warning')
        signupMessages.append(signupMessageElement)
    }

    if (checksFailed == true) {return}

    fetch(USER_PATH, {method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
    })
    .then(response => {
        const responseStatus =  response.status
        response.json().then(responseBody=>{
            if (responseStatus == 200) {
                fetch(LOGIN_PATH, {method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                    body: JSON.stringify(user)
                })
                .then(loginResponse => {
                    loginResponseStatus = loginResponse.status
                    loginResponse.json().then(loginResponseBody=>{
                        if (loginResponseStatus == 200) {
                            token = loginResponseBody.token
                            localStorage.setItem('token', BEARER.concat(token))
                            location.reload()
                            setState()
                        }
                        else {
                            const userCreatedElement = document.createElement('li')
                            userCreatedElement.innerText = "User successfully created!"
                            userCreatedElement.classList.add('message')
                            const userCreatedElement1 = document.createElement('li')
                            userCreatedElement1.innerText = "Unable to log in though, please log in."
                            userCreatedElement1.classList.add('message')
                            userCreatedElement1.classList.add('message-warning')
                            signupMessages.append(userCreatedElement, userCreatedElement1)        
                        }
                    })
                })
            }
            else {
                if (responseBody.errors.username) {
                    usernameErrors = responseBody.errors.username
                    usernameErrors.forEach(usernameError => {
                        const usernameErrorElement = document.createElement('li')
                        usernameErrorElement.innerText = usernameError
                        usernameErrorElement.classList.add('message')
                        usernameErrorElement.classList.add('message-warning')
                        signupMessages.append(usernameErrorElement)
                    });
                }
                if (responseBody.errors.password) {
                    passwordErrors = responseBody.errors.password
                    passwordErrors.forEach(passwordError => {
                        const passwordErrorElement = document.createElement('li')
                        passwordErrorElement.innerText = passwordError
                        passwordErrorElement.classList.add('message')
                        passwordErrorElement.classList.add('message-warning')
                        signupMessages.append(passwordErrorElement)
                    })
                }
            }
        })
    })
}

function updateColumnsLabel() {
    generateColumnsLabel.innerText = `${generateColumns.value} Columns`
}

function updateRowsLabel() {
    generateRowsLabel.innerText = `${generateRows.value} Rows`
}

function loginSubmit (event) {
    event.preventDefault()
    const username = loginFormUserName.value
    const password = loginFormPassword.value
    const user = {user: {username: username, password: password}}

    clearSignupLoginForms()

    if (username == '' || password == '') {
        const loginMessageElement = document.createElement('li')
        loginMessageElement.innerText = "You must specify both a user name and password."
        loginMessageElement.classList.add('message')
        loginMessageElement.classList.add('message-warning')
        loginMessages.append(loginMessageElement)
        return
    }

    fetch(LOGIN_PATH, {method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
        body: JSON.stringify(user)
    })
    .then(loginResponse => {
        loginResponseStatus = loginResponse.status
        loginResponse.json().then(loginResponseBody=>{
            if (loginResponseStatus == 200) {
                token = loginResponseBody.token
                localStorage.setItem('token', BEARER.concat(token))
                location.reload()
                setState()
            }
            else {
                const loginMessageElement = document.createElement('li')
                loginMessageElement.innerText = "Unable to log in."
                loginMessageElement.classList.add('message')
                loginMessageElement.classList.add('message-warning')
                const loginMessageElement1 = document.createElement('li')
                loginMessageElement1.innerText = "Please try logging in again."
                loginMessageElement1.classList.add('message')
                loginMessages.append(loginMessageElement, loginMessageElement1)        
            }
        })
    })
}

function loginActionSelect (event) {
    const targetElement = event.target

    if (targetElement == signup) {
        signup.classList.add('item-selected')
        login.classList.remove('item-selected')
        clearSignupLoginForms()
        signupForm.style.display = 'block'
        loginForm.style.display = 'none'
    }
    else if (targetElement == login) {
        login.classList.add('item-selected')
        signup.classList.remove('item-selected')
        clearSignupLoginForms()
        loginForm.style.display = 'block'
        signupForm.style.display = 'none'
    }
    else if (targetElement == logout) {
        localStorage.setItem('token', '')
        location.reload()
        setState()
    }
    else {}
}

function generateOptionSelect (event, target=event.target) {
    const targetElement = event.target

    if (targetElement == generateRandomSelect) {
        generateForm.dataset.mode = 'random'
        generateForm.style.display = 'block'
        generateForm.style.display = 'flex'
        generateRandomSelect.classList.add('item-selected')
        generateSpecifySelect.classList.remove('item-selected')
        generateThemes.style.display = 'block'
        generateFilePath.style.display = 'none'
    }
    else {
        generateForm.dataset.mode = 'specify'
        generateForm.style.display = 'block'
        generateForm.style.display = 'flex'
        generateSpecifySelect.classList.add('item-selected')
        generateRandomSelect.classList.remove('item-selected')
        generateThemes.style.display = 'none'
        generateFilePath.style.display = 'block'
    }
}

function allowDrop(event) {
    event.preventDefault()
}

function drag(event) {
    event.dataTransfer.setData("text", `${event.target.id}`)
}

// function quickPrettyTime(milisecondDuration) {
//     let seconds = milisecondDuration/1000
//     let minutes = Math.floor(seconds/60)
//     let newSeconds = seconds%60

//     let time = ""
//     if (minutes > 0) {
//         time = 
//     }
// }

function gameOver() {
    gameBoard.style.display = 'none'
    completedImage.style.display = 'block'
    
    const state = gatherState()
    const message = `You completed the puzzle in ${state.elapsed_time} milliseconds! (I know that isn't really helpful.)`
    // update selections to post challenge from save options
    alert(message)
}

function checkForCompleteness() {
    let i = 1
    let cardId = 0
    let locationId = 0

    while (i <= cardCount) {
        card = document.getElementById(`card-${i}`)
        cardId = card.dataset.id
        locationId = card.parentElement.dataset.id

        if(cardId != locationId) {return false}

        i = i+1
    }

    return true
}

function drop(event) {
    let checkCompleteness = true

    event.preventDefault()
    let srcCard = document.getElementById(event.dataTransfer.getData('text'))
    let trgtCard = event.target

    if(srcCard === trgtCard) {
        return
    }

    const srcLocation = srcCard.parentElement
    srcCard = srcLocation.removeChild(srcCard)
    const trgtLocation = trgtCard.parentElement
    trgtCard = trgtLocation.removeChild(trgtCard)

    srcLocation.append(trgtCard)
    trgtLocation.append(srcCard)

    if(srcLocation.dataset.id == trgtCard.dataset.id) {trgtCard.classList.remove('wrong-location')}
    else {
        trgtCard.classList.add('wrong-location')
        checkCompleteness = false
    }

    if(trgtLocation.dataset.id == srcCard.dataset.id) {srcCard.classList.remove('wrong-location')}
    else {
        srcCard.classList.add('wrong-location')
        checkCompleteness = false
    }

    if (checkCompleteness) {
        if(checkForCompleteness()) {
            gameOver()
        }
    }
}

function randomizeCards(cardCount) {
    let initialCards = []
    let randomMap = {}

    for (let i = 1; i <= cardCount; i++) {
        initialCards.push(i)
        randomMap[i] = ''
    }

    let i = 1
    
    while (i <= cardCount){
        const randomIndex = Math.floor(Math.random()*initialCards.length)

        if(initialCards[randomIndex] != i) {
            randomMap[i] = initialCards[randomIndex]
            initialCards = [...initialCards.slice(0, randomIndex), ...initialCards.slice(randomIndex+1)]
            i = i+1
        }
    }

    return randomMap
}

let cardCount = 0
let rows = 0
let columns = 0

function generateBoard() {
    event.preventDefault()

    const puzzle_id = localStorage.getItem('puzzle_id')
    if(puzzle_id == '' || puzzle_id == null) {
        deletePuzzleSaveSelect.classList.add('item-inactive')
    }
    else {
        deletePuzzleSaveSelect.classList.remove('item-inactive')
    }

    rows = generateRows.value
    columns = generateColumns.value
    cardCount = rows*columns
    const cardWidth = Math.floor((window.innerWidth-(2*boardBorder))/columns)
    const cardHeight = Math.floor(Math.floor((window.innerHeight-(2*boardBorder)-headerHeight-footerHeight)/2)/rows)
    const boardWidth = cardWidth * columns
    const boardHeight = cardHeight * rows
    let randomOrder = {}
    randomOrder = randomizeCards(cardCount)

    const generateMode = generateForm.dataset.mode
    
    let requestURL = ""
    const imageSubjects = generateThemes.value
    const referenceImg = document.createElement('img')
    const completedImg = document.createElement('img')

    let row=1
    let column=1
    let cell = 1
    let styleParams = ''

    while (row <=rows) {
        const boardRow = document.createElement('tr')
        gameBoard.appendChild(boardRow)
        while (column <= columns) {
           const cardLocation = document.createElement('td')
           cardLocation.dataset.id = cell
           cardLocation.id = `cell-${cell}`
           boardRow.append(cardLocation)
           
           const leftFudgeFactor = 0
           const bottomFudgeFactor = 3
           const cardImage = document.createElement('img')
           const cardNumber = randomOrder[cell]
           const cardID = `card-${cardNumber}`
           const clipRow = Math.floor((cardNumber-1) / columns)
           const clipColumn = (cardNumber-1) % columns
           const clipTop = clipRow * cardHeight
           const clipRight = (columns - clipColumn - 1) * cardWidth
           const clipBottom = (rows - clipRow - 1) * cardHeight
           const clipLeft = clipColumn * cardWidth
           const clipParams = `#${cardID}{clip-path: inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px);margin: -${clipTop}px -${clipRight}px -${clipBottom+bottomFudgeFactor}px -${clipLeft+leftFudgeFactor}px;}`
           
           styleParams = styleParams.concat(`${clipParams}`)

           cardImage.setAttribute('draggable', 'true')
           cardImage.setAttribute('ondragover', 'allowDrop(event)')
           cardImage.setAttribute('ondragstart', 'drag(event)')
           cardImage.setAttribute('ondrop', 'drop(event)')
           cardImage.dataset.id = cardNumber
           cardImage.id = cardID
           if(cell != cardNumber) {cardImage.classList.add('wrong-location')}
           cardLocation.append(cardImage)
           
           column = column + 1
           cell = cell + 1
        }
        column = 1
        row = row + 1
    }

    dynamicStyles.innerText = styleParams
    referenceImage.append(referenceImg)
    completedImage.append(completedImg)

    if (generateMode == 'random') {
        requestURL = `https://source.unsplash.com/${boardWidth}x${boardHeight}`
        if (imageSubjects != '') {
            requestURL = requestURL.concat(`/?${imageSubjects}`)
        }
            
        fetch(requestURL)
            .then(response => {
                referenceImg.src = response.url
                completedImg.src = response.url
                localStorage.setItem('image_master_url', response.url)
                for (let i = 1; i <= cardCount; i++) {
                    cardImage = document.getElementById(`card-${i}`)
                    cardImage.src = response.url
                }

                startTime = Number(Date.now())
            })
    }
    else {}

    completedImage.style.display = 'none'
    game.style.display = 'block'
    game.style.display = 'flex'
    generateForm.style.display = 'none'
}

setState()