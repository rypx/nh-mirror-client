(async () => {
    const fs = require('fs')
    const Spinner = new (require('terminal-multi-spinners'))({
        spinnerColor: 'blue',
        spinner: {"interval": 50, "frames": ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]}
    })
    const Request = require('request-promise')
    const RequestCallback = require('request')
    const Progress = require('request-progress')
    const Events = new (require('events')).EventEmitter
    const Chalk = require('chalk')

    const CONNECTION_LIMIT = 5
    const NUCLEAR_CODE = '243705'
    const META_URL = '< META_URL >'
    const DATA_URL = '< DATA_URL >' + NUCLEAR_CODE

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
    
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
        const i = Math.floor(Math.log(bytes) / Math.log(k));
    
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    let MetaURL = META_URL
    let data = await Request.get(DATA_URL, { json: true })
    
    let count = 0
    let pageCount = 0
    let requestConnection = 0

    Events.on('download-parts', (dat) => {
        let currentPage = pageCount++
        let currentCount = count
        Spinner.add(`parts-${currentCount}`, { text: `Downloading [ ${data.id} - Page: ${currentPage} / ${data.pages.length} ]..` })
        Progress(RequestCallback(`${MetaURL}${dat}`))
            .on('progress', (state) => {
                Spinner.update(`parts-${currentCount}`, { text: `Downloading [ ${data.id} - Page: ${currentPage} / ${data.pages.length} ] - ${formatBytes(state.size.transferred)} / ${formatBytes(state.size.total)}`})
            })
            .on('error', (err) => {
                console.error(err.toString())
            })
            .on('end', () => {
                Spinner.succeed(`parts-${currentCount}`, { text: `Success [ ${data.id} - Page: ${currentPage} / ${data.pages.length} ]`})
                requestConnection--
            })
            .pipe(fs.createWriteStream(`out/${currentPage}.png`))
    })

    setTimeout(_ => console.log(Chalk.blue.bold('( ͡° ͜ʖ ͡°) .. Rygna // rypx.\n')), 1000)
    let LoopUpdate = setInterval(async () => {
        if ( requestConnection < (CONNECTION_LIMIT + 1) ) {
            requestConnection++
            Events.emit('download-parts', data.pages[count])
            count++
        }

        if ( count === data.pages.length ) {
            clearInterval(LoopUpdate)
        }
    }, 1000)
})()