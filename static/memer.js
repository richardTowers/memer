'use strict'

const canvas= document.getElementById('meme-canvas')
const context = canvas.getContext('2d')
context.font = '30px monospace'
context.fillStyle = 'white'
context.strokeStyle = 'black'
context.lineWidth = 2
let state

function renderImage () {
    context.drawImage(this, 0, 0, 500, 333)
    state = context.getImageData(0, 0, 500, 333)
}

window.onload = function () {
    const firstImage = document.querySelector('img')
    if (firstImage) {
     renderImage.call(firstImage)   
    }
}

for (const img of document.querySelectorAll('img.meme-template')) {
    img.onclick = renderImage
}

const textBoxes = Array.from(document.querySelectorAll('.meme-text'))

const positions = [
    [80, 250],
    [250, 150],
    [400, 200],
]

for (let i = 0; i < textBoxes.length; i++) {
    textBoxes[i].onkeyup = function () {
        context.putImageData(state, 0, 0)
        context.strokeText(this.value, positions[i][0], positions[i][1])
        context.fillText(this.value, positions[i][0], positions[i][1])
    }
    textBoxes[i].onblur = function () {
        state = context.getImageData(0, 0, 500, 333)
    }
}
