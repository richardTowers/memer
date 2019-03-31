(function () {
    'use strict'

    const container = document.querySelector('#canvas-container')
    const img = document.querySelector('.meme-image')
    if (!container || !img) { return }

    let canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.top = 0


    const settings = {
        captions: [
            {x: 80, y: 250, dx: 100},
            {x: 250, y: 150, dx: 100},
            {x: 400, y: 200, dx: 100},
        ]
    }

    const captionsContainer = document.querySelector('#captions-container')
    for (let i = 0; i < settings.captions.length; i++) {
        const id = 'caption-' + i
        const formGroup = document.createElement('div')
        formGroup.className = 'govuk-form-group'
        const label = document.createElement('label')
        label.htmlFor = id
        label.appendChild(document.createTextNode('Caption ' + i))
        label.className = 'govuk-label'
        const input = document.createElement('input')
        input.id = id
        input.name = id
        input.className = 'govuk-input meme-text'
        formGroup.appendChild(label)
        formGroup.appendChild(input)
        captionsContainer.appendChild(formGroup)
    }

    const state = {
        title: '',
        captions: settings.captions.map(x => Object.assign(x))
    }
   
    function renderMemeText(canvas, context) {
        for (const caption of state.captions) {
            if (caption.value){
                context.strokeText(caption.value, caption.x, caption.y, caption.dx)
                context.fillText(caption.value, caption.x, caption.y, caption.dx)
            }
        }
    }

    img.onload = function () {
        // Lock the image's dimensions so it won't resize
        img.style.width = img.width + 'px'
        img.style.height = img.height + 'px'

        canvas.width = img.width
        canvas.height = img.height
        container.appendChild(canvas)

        const context = canvas.getContext('2d')
        context.font = '30px monospace'
        context.fillStyle = 'white'
        context.strokeStyle = 'black'
        context.lineWidth = 2

        document.onkeyup = function (ev) {
            if (/meme-text/.test(ev.target.className)) {
                const match = /caption-(\d+)/.exec(ev.target.id)
                if (match) {
                    const index = +match[1]
                    state.captions[index].value = ev.target.value
                }
            }
            
            context.clearRect(0, 0, canvas.width, canvas.height)
            renderMemeText(canvas, context)
        }

        document.forms[0].onsubmit = function () {
            const newCanvas = document.createElement('canvas')
            newCanvas.width = img.width
            newCanvas.height = img.height
            const newContext = newCanvas.getContext('2d')
            newContext.font = '30px monospace'
            newContext.fillStyle = 'white'
            newContext.strokeStyle = 'black'
            newContext.lineWidth = 2
            newContext.drawImage(img, 0, 0, img.width, img.height)
            renderMemeText(newCanvas, newContext)

            const input = document.createElement('input')
            input.type = 'hidden'
            input.value = newCanvas.toDataURL()
            document.forms[0].appendChild(input)
        }

    }

})()