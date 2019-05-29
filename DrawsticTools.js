function doUndoAction() {
    if (undoStack.length > 0) {
        redoStack.push(imageProcessed.clone());
        imageProcessed = undoStack.pop().clone();
        repaint();
        buildHisto();
        document.getElementById("redoButton").classList.remove("disabled");
    }
    if (undoStack.length == 0) {
        document.getElementById("undoButton").classList.add("disabled");
    }
}

function doRedoAction() {
    if (redoStack.length > 0) {
        undoStack.push(imageProcessed.clone());
        document.getElementById("undoButton").classList.remove("disabled");
        imageProcessed = redoStack.pop().clone();
        repaint();
        buildHisto();
    }
    if (redoStack.length == 0) {
        document.getElementById("redoButton").classList.add("disabled");
    }
}

function clickDrawShading() {
    addUndoAction();
    var color = [227, 198, 197, 255];
    var PrimColor = document.getElementById("ShaderPrimeColor").dataset.value;
    var SecondColor = document.getElementById("ShaderSecondColor").dataset.value;
    var ThirdColor = document.getElementById("ShaderThirdColor").dataset.value;
    var imageTemp = imageProcessed.clone();
    for (var y = 0; y < imageTemp.getHeight(); y++) {
        for (var x = 0; x < imageTemp.getWidth(); x++) {

            if (imageTemp.getIntColor(x, y) == SecondColor || imageTemp.getIntColor(x, y) == ThirdColor) {
                imageTemp.setIntColor2(x, y, (PrimColor & 0xFF000000) >>> 24, PrimColor);
            }
            if (imageTemp.getIntColor(x, y) == PrimColor) {
                for (var maskid = 0; maskid <= 7; maskid++) {
                    var count = 0;
                    var match = 0;
                    for (var mx = x - 2; mx <= x + 2; mx++) {
                        for (var my = y - 2; my <= y + 2; my++) {
                            if (shadingMask[maskid][my - y + 2][mx - x + 2] > 0) {
                                count++;
                                var red = imageTemp.getIntComponent0(mx, my);
                                var green = imageTemp.getIntComponent1(mx, my);
                                var blue = imageTemp.getIntComponent2(mx, my);
                                var alpha = imageTemp.getAlphaComponent(mx, my);
                                if (shadingMask[maskid][my - y + 2][mx - x + 2] == 1 && red <= 14 && green <= 10 && blue <= 10 && alpha > 0) {
                                    match++;
                                }
                                if (shadingMask[maskid][my - y + 2][mx - x + 2] == 2 && alpha == 0) {
                                    match++;
                                }
                            }
                        }
                    }
                    if (count == match) {
                        imageProcessed.setIntColor2(x, y, (SecondColor & 0xFF000000) >>> 24, SecondColor);
                        break;
                    }
                }

                for (var maskid = 0; maskid <= 1; maskid++) {
                    var count = 0;
                    var match = 0;
                    for (var mx = x - 2; mx <= x + 2; mx++) {
                        for (var my = y - 2; my <= y + 2; my++) {
                            if (shadingMask2[maskid][my - y + 2][mx - x + 2] == 1) {
                                count++;
                                var red = imageTemp.getIntComponent0(mx, my);
                                var green = imageTemp.getIntComponent1(mx, my);
                                var blue = imageTemp.getIntComponent2(mx, my);
                                var alpha = imageTemp.getAlphaComponent(mx, my);
                                if (red <= 14 && green <= 10 && blue <= 10 && alpha > 0) {
                                    match++;
                                }
                            }
                        }
                    }
                    if (count == match) {
                        imageProcessed.setIntColor2(x, y, (ThirdColor & 0xFF000000) >>> 24, ThirdColor);
                        break;
                    }
                }
            }
        }
    }
    repaint();
    buildHisto();
}


function clickRemoveBorder() {
    addUndoAction();
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
    addUndoAction();
    var imageTemp = imageProcessed.clone();
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
    addUndoAction();
    imageProcessed = imageOriginal.clone();
    buildHisto();
    repaint();
}

function clickOptimize() {
    addUndoAction();
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
