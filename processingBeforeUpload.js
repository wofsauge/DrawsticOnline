var canvas = document.getElementById("canvas");
var canvasOriginal = document.getElementById("original");
var imageOriginal = new MarvinImage();
var imageProcessed = new MarvinImage();
var undoStack = [];
var redoStack = [];
var scale = 1;

document.getElementById('picField').onchange = function (evt) {
    var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            imageOriginal.load(fr.result, imageLoaded);
            document.getElementById("actionBar").style.display = "block";
            document.getElementById("editField").style.display = "block";
        }
        fr.readAsDataURL(files[0]);
    }

    // Not supported
    else {
        // fallback -- perhaps submit the input to an iframe and temporarily store
        // them on the server until the user's session ends.
    }
}

$(document).ready(function () {
    $("body").tooltip({
        selector: '[data-toggle=tooltip]',
        delay: {
            show: 500,
            hide: 100
        },
        placement: "right"
    });
    $('button').on('mousedown', function () {
        $('[data-toggle="tooltip"]').tooltip('hide');
    });
    $('[data-toggle="tooltip"]').on('mouseleave', function () {
        $('[data-toggle="tooltip"]').tooltip('hide');
    });
    cols = document.querySelectorAll('#colorPicker');
	[].forEach.call(cols, function (col) {
        col.addEventListener('dragenter', handleDragEnter, false);
        col.addEventListener('dragover', handleDragOver, false);
        col.addEventListener('dragleave', handleDragLeave, false);
        col.addEventListener('drop', handleDrop, false);
        col.addEventListener('dragend', handleDragEnd, false);
    });
    loadPalettes();
});

function loadPalettes() {
    searchString = document.getElementById("searchInput").value;
    $("#colors").empty();
    $("#colors").append(new Option("-- choose Entity to load its colorpalette --", 0));
    var i = 0;
    console.log(searchString);
    if (searchString == null) {
        $.each(datafamiliar, function (key, value) {
            if (searchString == null || datafamiliar[i].Name.search(searchString) != -1) {
                $("#colors").append(new Option(datafamiliar[i].Name, i));
            }
            i++;
        });
    } else {
        $.each(data, function (key, value) {
            if (data[i].Name.search(searchString) != -1) {
                $("#colors").append(new Option(data[i].Name, i));
            }
            i++;
        });
    }
}

function addUndoAction() {
    undoStack.push(imageProcessed.clone());
    document.getElementById("undoButton").classList.remove("disabled");
    while (redoStack.length) {
        redoStack.pop();
    }
    document.getElementById("redoButton").classList.add("disabled");
}

function onEntityColorPaletteChange() {
    var tempColor = imageProcessed.getIntColor(0, 0);
    var myNode = document.getElementById("histogramEntity").innerHTML = '';
    entityID = document.getElementById("colors").value;
    for (i = 0; i < data[entityID].frequentColors.length; i++) {
        color = data[entityID].frequentColors[i];
        imageProcessed.setIntColor(0, 0, color.A, color.R, color.G, color.B);
        var div = document.createElement("div");
        div.setAttribute('class', 'histEntry');
        div.setAttribute('draggable', 'true');
        div.setAttribute('data-lookup', 'true');
        div.setAttribute('id', imageProcessed.getIntColor(0, 0));
        div.classList.add("tooltip2");
        div.innerHTML = color.count + "<span class=\"tooltiptext\">Red: " + color.R + " Green: " + color.G + " Blue: " + color.B + " Alpha: " + color.A + "</span>";
        div.style.background = "rgba(" + color.R + "," + color.G + "," + color.B + "," + color.A + ")";
        document.getElementById("histogramEntity").appendChild(div);
    }
    cols = document.querySelectorAll('.histEntry');
	[].forEach.call(cols, function (col) {
        col.addEventListener('dragstart', handleDragStart, false);
        col.addEventListener('dragenter', handleDragEnter, false)
        col.addEventListener('dragover', handleDragOver, false);
        col.addEventListener('dragleave', handleDragLeave, false);
        col.addEventListener('drop', handleDrop, false);
        col.addEventListener('dragend', handleDragEnd, false);
    });
    imageProcessed.setIntColor(0, 0, tempColor);
}

function imageLoaded() {
    imageProcessed = imageOriginal.clone();
    canvasOriginal.width = imageOriginal.getWidth();
    canvasOriginal.height = imageOriginal.getHeight();
    canvasOriginal.getContext("2d").fillStyle = "#eeeeee";
    canvasOriginal.getContext("2d").fillRect(0, 0, canvasOriginal.width, canvasOriginal.height);
    imageOriginal.draw(canvasOriginal);
    canvas.width = imageOriginal.getWidth();
    canvas.height = imageOriginal.getHeight();
    canvas.getContext("2d").fillStyle = "#eeeeee";
    canvas.getContext("2d").fillRect(0, 0, canvasOriginal.width, canvasOriginal.height);

    buildHisto();
    repaint();
}

function repaint() {
    canvas.getContext("2d").fillStyle = "#eeeeee";
    canvas.getContext("2d").fillRect(0, 0, canvasOriginal.width, canvasOriginal.height);
    var temp = new MarvinImage();
    Marvin.scale(imageProcessed, temp, canvasOriginal.width, canvasOriginal.height);
    temp.draw(canvas);
    imageProcessed.update();
}

function replaceColor(oldColor, newColor) {
    for (var y = 0; y < imageOriginal.getHeight(); y++) {
        for (var x = 0; x < imageOriginal.getWidth(); x++) {
            if (imageProcessed.getIntColor(x, y) == oldColor) {
                imageProcessed.setIntColor2(x, y, (newColor & 0xFF000000) >>> 24, newColor);
            }
        }
    }
}

var hist = [];

function buildHisto() {
    hist = [];
    for (var y = 0; y < imageProcessed.getHeight(); y++) {
        for (var x = 0; x < imageProcessed.getWidth(); x++) {
            var all = imageProcessed.getIntColor(x, y);
            var red = imageProcessed.getIntComponent0(x, y);
            var green = imageProcessed.getIntComponent1(x, y);
            var blue = imageProcessed.getIntComponent2(x, y);
            var alpha = imageProcessed.getAlphaComponent(x, y);
            if (alpha == 0) {
                continue;
            }
            var temp = false;
            for (i = 0; i < hist.length; i++) {
                if (hist[i][0] == all) {
                    hist[i][5]++;
                    temp = true;
                }
            }
            if (!temp) {
                hist.push([all, red, green, blue, alpha, 1, 0]);
            }
        }
    }
    hist.sort(function (a, b) {
        return b[5] - a[5];
    });

    if (document.getElementById("CheckboxSort").checked) {
        for (i = 0; i < hist.length; i++) {
            var smallestD = 25;
            for (j = 0; j < hist.length; j++) {
                delta = deltaE(rgb2lab(hist[i][1], hist[i][2], hist[i][3]), rgb2lab(hist[j][1], hist[j][2], hist[j][3]));
                if (smallestD > delta && delta > 0) {
                    smallestD = delta;
                    hist[i][6] = j;
                    hist[i][7] = hist[j][5];
                }
            }
        }

        for (i = 1; i < hist.length - 1; i++) {
            var nextEntry = hist[i - 1][6];
            if (hist[i - 1][5] > hist[nextEntry][5] && hist[nextEntry][6] != null) {
                var temp = hist[i];
                hist[i] = hist[nextEntry];
                hist[nextEntry] = temp;
            }
        }
    }
    var myNode = document.getElementById("histogram").innerHTML = '';

    for (i = 0; i < hist.length; i++) {
        var div = document.createElement("div");
        div.setAttribute('class', 'histEntry');
        div.setAttribute('draggable', 'true');
        div.setAttribute('onmouseover', 'onHoverHisto(this)');
        div.setAttribute('data-lookup', 'false');
        div.setAttribute('id', hist[i][0]);
        div.innerHTML = hist[i][5] + "<span style=\"display: none;\">Red: " + hist[i][1] + " Green: " + hist[i][2] + " Blue: " + hist[i][3] + " Alpha: " + hist[i][4] + " delta: " + hist[i][7] + "</span>";

        div.style.background = "rgba(" + hist[i][1] + "," + hist[i][2] + "," + hist[i][3] + "," + hist[i][4] + ")";
        document.getElementById("histogram").appendChild(div);
    }
    cols = document.querySelectorAll('.histEntry');
	[].forEach.call(cols, function (col) {
        col.addEventListener('dragstart', handleDragStart, false);
        col.addEventListener('dragenter', handleDragEnter, false);
        col.addEventListener('dragover', handleDragOver, false);
        col.addEventListener('dragleave', handleDragLeave, false);
        col.addEventListener('drop', handleDrop, false);
        col.addEventListener('dragend', handleDragEnd, false);
    });
    repaint();
}



function onHoverHisto(x) {
    document.getElementById("rbgDisplay").innerHTML = x.childNodes[1].innerHTML;
}

var cols;
var dragSrcEl = null;

function handleDragStart(e) {
    this.style.opacity = '0.4';
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/id', this.id);
    e.dataTransfer.setData('text/html', this.firstChild.innerText);
    e.dataTransfer.setData('text/lookup', this.dataset.lookup);

	[].forEach.call(cols, function (col) {
        col.classList.add('dropable');
    });

    document.getElementById("ButtonMaus").checked;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (e.dataTransfer.getData('text/lookup') == "true") {
        return false;
    }
    this.classList.add('over');
}

function handleDragLeave(e) {
    if (e.dataTransfer.getData('text/lookup') == "true") {
        return false;
    }
    this.classList.remove('over');
    //dragSrcEl.style.opacity = '1';
}

function handleDrop(target) {
    if (target.stopPropagation) {
        target.stopPropagation(); // Stops some browsers from redirecting.
    }

    // Don't do anything if dropping the same column we're dragging.
    if (dragSrcEl != this) {
        addUndoAction();
        if (this.id == "colorPicker") {
            //Droping something on the Colorpicker Color field
            var tempColor = imageProcessed.getIntColor(0, 0);
            var c = this.value.substr(1);
            var r = parseInt(c.slice(0, 2), 16),
                g = parseInt(c.slice(2, 4), 16),
                b = parseInt(c.slice(4, 6), 16);
            imageProcessed.setIntColor(0, 0, 255, r, g, b);
            replaceColor(target.dataTransfer.getData('text/id'), imageProcessed.getIntColor(0, 0));
            imageProcessed.setIntColor(0, 0, tempColor);
            buildHisto();
        } else if (this.dataset.value != null) {
            //drop something on the shading config
            this.dataset.value = dragSrcEl.id;
            this.style.background = dragSrcEl.style.background;

        } else {
            //Droping something on the Histogram Color field
            if (this.parentNode.id == "histogramEntity") {
                if (target.dataTransfer.getData('text/lookup') == "true") {
                    //do nothing when dropping a lookup object onto another
                    return false;
                }
                dragSrcEl.style.background = this.style.background;
            } else {
                if (target.dataTransfer.getData('text/lookup') == "true") {
                    //replace colors when dragging Lookup onto Histogramm

                    this.style.background = dragSrcEl.style.background;
                    replaceColor(this.id, dragSrcEl.id);
                    repaint();
                    return false;
                }
                this.firstChild.innerText = Number(this.firstChild.innerText) + Number(target.dataTransfer.getData('text/html'));
                dragSrcEl.remove();
            }
            replaceColor(target.dataTransfer.getData('text/id'), this.id);
        }
        repaint();
    }
    return false;
}

function handleDragEnd(e) {
	[].forEach.call(cols, function (col) {
        col.classList.remove('over');
        col.classList.remove('dropable');
        col.style.opacity = '1';
    });
}

function rgb2lab(r1, g1, b1) {
    var r = r1 / 255,
        g = g1 / 255,
        b = b1 / 255,
        x, y, z;

    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
    y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
    z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

    return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

function deltaE(labA, labB) {
    var deltaL = labA[0] - labB[0];
    var deltaA = labA[1] - labB[1];
    var deltaB = labA[2] - labB[2];
    var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    var deltaC = c1 - c2;
    var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    var sc = 1.0 + 0.045 * c1;
    var sh = 1.0 + 0.015 * c1;
    var deltaLKlsl = deltaL / (1.0);
    var deltaCkcsc = deltaC / (sc);
    var deltaHkhsh = deltaH / (sh);
    var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
}

var lastHover;
var timeOut = 0;
var m_pos_x, m_pos_y;
var bucketBlocker = false;
var undoBlocker = false;
window.onmousemove = function (e) {
    m_pos_x = e.clientX;
    m_pos_y = e.clientY;
}

$(canvas).on('mousedown touchstart', function (e) {
    var context = canvas.getContext("2d");
    timeOut = setInterval(function () {
        var pos = getMousePos(canvas, e);
        if (document.getElementById("ButtonColorpicker").checked) {
            var currentHover = imageProcessed.getIntColor(Math.floor(pos.x / scale), Math.floor(pos.y / scale));
            if (document.getElementById(currentHover) == null) {
                return;
            }
            if (lastHover != null && currentHover != lastHover) {
                document.getElementById(lastHover).classList.remove('colorpicked');
            }
            document.getElementById(currentHover).classList.add('colorpicked');
            lastHover = currentHover;
        } else if (document.getElementById("ButtonPencil").checked) {
            if (!undoBlocker) {
                addUndoAction();
                undoBlocker = true;
            }
            var PrimColor = document.getElementById("ShaderPrimeColor").dataset.value;
            imageProcessed.setIntColor(Math.floor(pos.x / scale), Math.floor(pos.y / scale), PrimColor);
            repaint();
        } else if (document.getElementById("ButtonBucket").checked && !bucketBlocker) {
            if (!undoBlocker) {
                addUndoAction();
                undoBlocker = true;
            }
            bucketBlocker = true;
            var todolist = [];
            var PrimColor = document.getElementById("ShaderPrimeColor").dataset.value;
            var clickedColor = imageProcessed.getIntColor(Math.floor(pos.x / scale), Math.floor(pos.y / scale));
            todolist.push([Math.floor(pos.x / scale), Math.floor(pos.y / scale)]);
            while (todolist.length > 0) {
                var item = todolist.pop();
                if (imageProcessed.getIntColor(item[0], item[1]) == clickedColor & imageProcessed.getIntColor(item[0], item[1]) != PrimColor) {
                    imageProcessed.setIntColor(item[0], item[1], PrimColor);
                    todolist.push([item[0] + 1, item[1]]);
                    todolist.push([item[0], item[1] + 1]);
                    todolist.push([item[0] - 1, item[1]]);
                    todolist.push([item[0], item[1] - 1]);
                }
            }
            repaint();
        }
    }, 10);
}).bind('mouseup mouseleave touchend', function () {
    buildHisto();
    clearInterval(timeOut);
    bucketBlocker = false;
    undoBlocker = false;
});


function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width, // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height; // relationship bitmap vs. element for Y

    return {
        x: (m_pos_x - rect.left) * scaleX, // scale mouse coordinates after they have
        y: (m_pos_y - rect.top) * scaleY // been adjusted to be relative to element
    }
}

var shadingMask = [[[0, 0, 1, 0, 0],
						[0, 1, 1, 1, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0]],
					   [[0, 0, 0, 0, 0],
						[0, 1, 0, 0, 0],
						[1, 1, 0, 0, 0],
						[0, 1, 0, 0, 0],
						[0, 0, 0, 0, 0]],
					   [[0, 0, 0, 0, 0],
						[0, 0, 0, 1, 0],
						[0, 0, 0, 1, 1],
						[0, 0, 0, 1, 0],
						[0, 0, 0, 0, 0]],
					   [[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[0, 1, 1, 1, 0],
						[0, 0, 1, 0, 0]],
					   [[0, 0, 0, 0, 0],
						[0, 0, 1, 0, 0],
						[0, 0, 0, 1, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0]],
					   [[0, 0, 0, 0, 0],
						[0, 0, 1, 0, 0],
						[0, 1, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0]],
					   [[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 1, 1],
						[0, 0, 0, 1, 2]],
					   [[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[1, 1, 0, 0, 0],
						[2, 1, 0, 0, 0]]];
var shadingMask2 = [[[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[0, 0, 0, 1, 1],
						[0, 0, 1, 0, 0],
						[0, 0, 1, 0, 0]],
					   [[0, 0, 0, 0, 0],
						[0, 0, 0, 0, 0],
						[1, 1, 0, 0, 0],
						[0, 0, 1, 0, 0],
						[0, 0, 1, 0, 0]]];
