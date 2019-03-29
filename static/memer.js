'use strict'

const canvas= document.getElementById('meme-canvas')
const context = canvas.getContext('2d')
let state

function renderImage () {
    context.drawImage(this, 0, 0, 200, 200)
    state = context.getImageData(0, 0, 200, 200)
}

window.onload = function () {
    const firstImage = document.querySelector('img')
    renderImage.call(firstImage)
}

for (const img of document.querySelectorAll('img.meme-template')) {
    img.onclick = renderImage
}

document.querySelector('#meme-text').onkeyup = function () {
    context.putImageData(state, 0, 0)
    context.fillText(this.value, 50, 50)
}