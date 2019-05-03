(function () {
    'use strict'

    // TODO: don't hardcode these
    const settingsByImage = {
        'templates:b53c9f1baa6c7c2543c39a72db2896fc-The-Scroll-Of-Truth.jpg': {
            captions: [
                { x: 20, y: 62, fill: '#000', stroke: null },
                { x: 20, y: 67, fill: '#000', stroke: null },
                { x: 20, y: 72, fill: '#000', stroke: null },
                { x: 20, y: 77, fill: '#000', stroke: null },
            ]
        },
        'templates:40bec809fc23760ce6ece3e322dde56a-pigeon.jpg': {
            captions: [
                { x: 23, y: 40, fill: '#fff', stroke: '#000' },
                { x: 28, y: 95, fill: '#fff', stroke: '#000' },
                { x: 70, y: 20, fill: '#fff', stroke: '#000' },
            ]
        }
    }

    const container = document.querySelector('#canvas-container')
    const img = document.querySelector('.meme-image')
    if (!container || !img) { return }

    let canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.top = 0

    // TODO: do this in a less fragile, hacky way
    const settings = settingsByImage[location.pathname.split('/')[2]] || {
        captions: [
                { x: 10, y: 10, fill: '#fff', stroke: '#000', stroke: null },
                { x: 10, y: 20, fill: '#fff', stroke: '#000', stroke: null },
                { x: 10, y: 30, fill: '#fff', stroke: '#000', stroke: null },
                { x: 10, y: 40, fill: '#fff', stroke: '#000', stroke: null },
                { x: 10, y: 50, fill: '#fff', stroke: '#000', stroke: null },
                { x: 10, y: 60, fill: '#fff', stroke: '#000', stroke: null },
                { x: 10, y: 70, fill: '#fff', stroke: '#000', stroke: null },
                { x: 10, y: 80, fill: '#fff', stroke: '#000', stroke: null },
                { x: 10, y: 90, fill: '#fff', stroke: '#000', stroke: null },
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
        context.font = '16px monospace'
        context.lineWidth = 2

        for (const caption of state.captions) {
            if (caption.value){
                context.fillStyle = caption.fill
                context.strokeStyle = caption.stroke
                const x = canvas.width * caption.x / 100
                const y = canvas.height * caption.y / 100
                if (caption.stroke) {
                    context.strokeText(caption.value, x, y)
                }
                if (caption.fill) {
                    context.fillText(caption.value, x, y)
                }
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
            newContext.drawImage(img, 0, 0, img.width, img.height)
            renderMemeText(newCanvas, newContext)

            const input = document.createElement('input')
            input.type = 'hidden'
            input.value = newCanvas.toDataURL()
            input.name = 'meme-data-url'
            document.forms[0].appendChild(input)
        }

    }

})()