var canvas = document.getElementById("canvas");
var canvasOriginal = document.getElementById("original");
var imageOriginal = new MarvinImage();
var imageProcessed = new MarvinImage();
var imageDisplay = new MarvinImage();
var scale = 1;

document.getElementById('picField').onchange = function(evt) {
    var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function() {
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
$(document).ready(function() {
    $("body").tooltip({
        selector: '[data-toggle=tooltip]',
        delay: {
            show: 500,
            hide: 100
        },
        placement: "right"
    });
    $('button').on('mousedown', function() {
        $('[data-toggle="tooltip"]').tooltip('hide');
    });
    $('[data-toggle="tooltip"]').on('mouseleave', function() {
        $('[data-toggle="tooltip"]').tooltip('hide');
    });
 cols = document.querySelectorAll('#colorPicker');
    [].forEach.call(cols, function(col) {
        col.addEventListener('dragenter', handleDragEnter, false);
        col.addEventListener('dragover', handleDragOver, false);
        col.addEventListener('dragleave', handleDragLeave, false);
        col.addEventListener('drop', handleDrop, false);
        col.addEventListener('dragend', handleDragEnd, false);
    });
    loadPalettes();
});

function loadPalettes() {
    entityName = document.getElementById("searchInput").value;
    $("#colors").empty();
    $("#colors").append(new Option("-- choose Entity to load its colorpalette --", 0));
    var i = 0;
    $.each(data, function(key, value) {
        if (entityName == null || data[i].Name.search(entityName) != -1) {
            $("#colors").append(new Option(data[i].Name, i));
        }
        i++;
    });

}

function onColorChange() {
    var tempColor = imageProcessed.getIntColor(0, 0);
    var myNode = document.getElementById("histogramEntity").innerHTML = '';
    entityID = document.getElementById("colors").value;
    for (i = 0; i < data[entityID].frequentColors.length; i++) {
        color = data[entityID].frequentColors[i];
        imageProcessed.setIntColor(0, 0, color.A, color.R, color.G, color.B);
        var div = document.createElement("div");
        div.setAttribute('class', 'histEntry');
        div.setAttribute('draggable', 'true');
        div.setAttribute('id', imageProcessed.getIntColor(0, 0));
        div.classList.add("tooltip2");
        div.innerHTML = "<span>" + color.count + "</span>  <span class=\"tooltiptext\">Red: " + color.R + " Green: " + color.G + " Blue: " + color.B + " Alpha: " + color.A + "</span>";
        div.style.background = "rgba(" + color.R + "," + color.G + "," + color.B + "," + color.A + ")";
        document.getElementById("histogramEntity").appendChild(div);
    }
    cols = document.querySelectorAll('.histEntry');
    [].forEach.call(cols, function(col) {
        col.addEventListener('dragstart', handleDragStart, false);
        col.addEventListener('dragenter', handleDragEnter, false)
        col.addEventListener('dragover', handleDragOver, false);
        col.addEventListener('dragleave', handleDragLeave, false);
        col.addEventListener('drop', handleDrop, false);
        col.addEventListener('dragend', handleDragEnd, false);
    });
    imageProcessed.setIntColor(0, 0, tempColor);
}

function changeZoom() {
    scale = document.getElementById("zoomlevel").value / 100;
    canvasOriginal.width = imageOriginal.getWidth() * scale;
    canvasOriginal.height = imageOriginal.getHeight() * scale;
    canvasOriginal.getContext("2d").fillStyle = "#eeeeee";
    canvasOriginal.getContext("2d").fillRect(0, 0, canvasOriginal.width, canvasOriginal.height);
    var temp = new MarvinImage();
    Marvin.scale(imageOriginal, temp, canvasOriginal.width, canvasOriginal.height);
    temp.draw(canvasOriginal);
    canvas.width = imageOriginal.getWidth() * scale;
    canvas.height = imageOriginal.getHeight() * scale;
    canvas.getContext("2d").fillStyle = "#eeeeee";
    canvas.getContext("2d").fillRect(0, 0, canvasOriginal.width, canvasOriginal.height);
    temp = new MarvinImage();
    Marvin.scale(imageProcessed, temp, canvasOriginal.width, canvasOriginal.height);
    temp.draw(canvas);
}

function changeOriginalTransparency() {
    scale = document.getElementById("transparency").value;
    scale2 = document.getElementById("transparencyCheck").checked;
    if (scale2 == 0) {
        canvasOriginal.style.display = "none";
    } else {
        canvasOriginal.style.opacity = scale * scale2;
        canvasOriginal.style.display = "block";
    }
}

function clickDownload() {
    temp = new MarvinImage();
    Marvin.scale(imageProcessed, temp, imageOriginal.getWidth(), imageOriginal.getHeight());
    canvas.width = imageOriginal.getWidth();
    canvas.height = imageOriginal.getHeight();
    temp.draw(canvas);
    var link = document.createElement('a');
    link.download = 'Download.png';
    link.href = canvas.toDataURL("image/png")
    link.click();
    changeZoom();
}

function clickReset() {
    imageProcessed = imageOriginal.clone();
    buildHisto();
    repaint();

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

function clickRemoveBorder() {
    for (var y = 0; y < imageProcessed.getHeight(); y++) {
        for (var x = 0; x < imageProcessed.getWidth(); x++) {
            var red = imageProcessed.getIntComponent0(x, y);
            var green = imageProcessed.getIntComponent1(x, y);
            var blue = imageProcessed.getIntComponent2(x, y);
            var alpha = imageProcessed.getAlphaComponent(x, y);

            if (red <= 14 && green <= 10 && blue <= 10 && alpha > 0) {
                imageProcessed.setIntColor(x, y, 0, 0, 0, 0);
            }
        }
    }
    repaint();
    buildHisto();
    return imageProcessed.clone();
}

function evalEnvironment(img, x, y) {
    return img.getAlphaComponent(x - 1, y - 1) + img.getAlphaComponent(x - 1, y) + img.getAlphaComponent(x - 1, y + 1) + img.getAlphaComponent(x, y - 1) + img.getAlphaComponent(x, y + 1) + img.getAlphaComponent(x + 1, y - 1) + img.getAlphaComponent(x + 1, y) + img.getAlphaComponent(x + 1, y + 1) + img.getAlphaComponent(x - 2, y) + img.getAlphaComponent(x + 2, y) + img.getAlphaComponent(x, y - 2) + img.getAlphaComponent(x, y + 2);
}

function clickDrawBorder() {
    var imageTemp = clickRemoveBorder();
    for (var y = 0; y < imageTemp.getHeight(); y++) {
        for (var x = 0; x < imageTemp.getWidth(); x++) {
            var red = imageTemp.getIntComponent0(x, y);
            var green = imageTemp.getIntComponent1(x, y);
            var blue = imageTemp.getIntComponent2(x, y);
            var alpha = imageTemp.getAlphaComponent(x, y);

            if (evalEnvironment(imageTemp, x, y) > 0 && alpha == 0) {
                imageProcessed.setIntColor(x, y, 255, 14, 0, 0);
            }
        }
    }
    repaint();
    buildHisto();
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
    hist.sort(function(a, b) {
        return b[5] - a[5];
    });

    var myNode = document.getElementById("histogram").innerHTML = '';

    for (i = 0; i < hist.length; i++) {
        var div = document.createElement("div");
        div.setAttribute('class', 'histEntry');
        div.setAttribute('draggable', 'true');
        div.setAttribute('onmouseover', 'onHoverHisto(this)');
        div.setAttribute('id', hist[i][0]);
        div.innerHTML = "<span>" + hist[i][5] + "</span>  <span style=\"display: none;\">Red: " + hist[i][1] + "	Green: " + hist[i][2] + "	Blue: " + hist[i][3] + "&#09; Alpha: " + hist[i][4] + "</span>";
        div.style.background = "rgba(" + hist[i][1] + "," + hist[i][2] + "," + hist[i][3] + "," + hist[i][4] + ")";
        document.getElementById("histogram").appendChild(div);
    }
    cols = document.querySelectorAll('.histEntry');
    [].forEach.call(cols, function(col) {
        col.addEventListener('dragstart', handleDragStart, false);
        col.addEventListener('dragenter', handleDragEnter, false);
        col.addEventListener('dragover', handleDragOver, false);
        col.addEventListener('dragleave', handleDragLeave, false);
        col.addEventListener('drop', handleDrop, false);
        col.addEventListener('dragend', handleDragEnd, false);
    });
    repaint();
}

function clickOptimize() {
    for (i = hist.length - 1; i >= 0; i--) {
        for (j = hist.length - 1; j >= 0; j--) {
            delta = deltaE(rgb2lab(hist[i][1], hist[i][2], hist[i][3]), rgb2lab(hist[j][1], hist[j][2], hist[j][3]));
            if (delta > 0 && delta < 2 && Math.abs(hist[i][4] - hist[j][4]) < 100) {
                replaceColor(hist[j][0], hist[i][0]);
            }
        }
    }
    buildHisto();
}

function clickDetectCorners() {
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ff0000";
    var x1 = 0;
    var y1 = 0;
    var count = 0;
    var x2 = 0;
    var y2 = 0;
    var count2 = 0;
    var width = 32;
    for (var y = -width / 2; y <= width / 2; y++) {
        for (var x = -width / 2; x <= width / 2; x++) {
            var alpha = imageProcessed.getAlphaComponent(x + width / 2, y + width / 2);
            var red = imageProcessed.getIntComponent0(x + width / 2, y + width / 2);
            var green = imageProcessed.getIntComponent1(x + width / 2, y + width / 2);
            var blue = imageProcessed.getIntComponent2(x + width / 2, y + width / 2);
            if (alpha > 0) {
                x1 += x;
                y1 += y;
                count++;
            }
            if (red == 201 && green == 190 && blue == 203) {
                x2 += x;
                y2 += y;
                count2++;
            }
        }
    }
    ctx.fillRect(Math.floor(x1 / count + width / 2), Math.floor(y1 / count + width / 2), 2, 2);
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(Math.floor(x2 / count2 + width / 2), Math.floor(y2 / count2 + width / 2), 2, 2);
    console.log(count + "x1:" + (x1 / count + width / 2) + ",y1:" + (y1 / count + width / 2));
    console.log(count2 + "x1:" + (x2 / count2 + width / 2) + ",y1:" + (y2 / count2 + width / 2));
}

function onHoverHisto(x) {
    document.getElementById("rbgDisplay").innerHTML = x.childNodes[2].innerHTML;
}

var cols;
var dragSrcEl = null;

function handleDragStart(e) {
    this.style.opacity = '0.4';
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/id', this.id);
    e.dataTransfer.setData('text/html', this.firstChild.innerText);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');
    dragSrcEl.style.opacity = '1';
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
    }

    // Don't do anything if dropping the same column we're dragging.
    if (dragSrcEl != this) {
		if (this.value!=null){
    var tempColor = imageProcessed.getIntColor(0, 0);
		var c = this.value.substr(1);
  var r = parseInt(c.slice(0,2), 16),
      g = parseInt(c.slice(2,4), 16),
      b = parseInt(c.slice(4,6), 16);
        imageProcessed.setIntColor(0, 0, 255, r, g, b);
        replaceColor(e.dataTransfer.getData('text/id'), imageProcessed.getIntColor(0, 0));
		imageProcessed.setIntColor(0, 0, tempColor);
    buildHisto();
			
		}else{
        replaceColor(e.dataTransfer.getData('text/id'), this.id);
        this.firstChild.innerText = Number(this.firstChild.innerText) + Number(e.dataTransfer.getData('text/html'));
        dragSrcEl.remove();
		}

        repaint();
    }

    return false;
}

function handleDragEnd(e) {
    [].forEach.call(cols, function(col) {
        col.classList.remove('over');
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