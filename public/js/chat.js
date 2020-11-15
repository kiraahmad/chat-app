const socket = io()
//Elements
const chatForm = document.querySelector('#message-form')
const messageContext = document.querySelector('#message')
const messageSubmitButton = document.querySelector('#submit-button')
const locButton = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    //New message element
    const newMessage = messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = messages.offsetHeight

    //Height of messages container
    const containerHeight = messages.scrollHeight

    //How far did we scroll ?
    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locMessage) => {
    console.log(locMessage)
    const html = Mustache.render(locationTemplate, {
        username: locMessage.username,
        url: locMessage.url ,
        createdAt: moment(locMessage.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
     const html = Mustache.render(sidebarTemplate, {
         room,
         users
     })
     document.querySelector('#sidebar').innerHTML = html
})

chatForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // Disable form after sending a message until the message is sent
    messageSubmitButton.setAttribute('disabled', 'disabled')
    //e.target we target the input element which named as "message" in the html file
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        //Re-enable the form after the message is successfully sent
        messageSubmitButton.removeAttribute('disabled')
        messageContext.value = ''
        messageContext.focus()

        if(error) {
            return console.log(error)
        }

        console.log('message Delivered!')
    })

})

locButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }

    locButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
        },() => {
            locButton.removeAttribute('disabled')
           console.log('Location shared!')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})