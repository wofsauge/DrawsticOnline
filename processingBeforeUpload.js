

var canvas = document.getElementById("canvas");
var canvasOriginal = document.getElementById("original");
var imageOriginal = new MarvinImage();
var imageProcessed = new MarvinImage();
var imageDisplay = new MarvinImage();
var scale=1;

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
$(document).ready(function() {
    $("body").tooltip({ selector: '[data-toggle=tooltip]',
      delay: {show: 500, hide: 100},placement:"right"  }); 
    $('button').on('mousedown', function(){
      $('[data-toggle="tooltip"]').tooltip('hide');
    });
    $('[data-toggle="tooltip"]').on('mouseleave', function(){
      $('[data-toggle="tooltip"]').tooltip('hide');
    });
	loadPalettes();
});

function loadPalettes(){
  entityName=document.getElementById("searchInput").value;
  $("#colors").empty();
  $("#colors").append(new Option("-- choose Entity to load its colorpalette --", 0));
	var i = 0;
	$.each( data, function( key, value ) {
		if(entityName==null || data[i].Name.search(entityName)!=-1){
		$("#colors").append(new Option(data[i].Name, i));}
		i++;
	});
	
}

function onColorChange(){
	var tempColor = imageProcessed.getIntColor(0,0);
  var myNode = document.getElementById("histogramEntity").innerHTML = '';
  entityID=document.getElementById("colors").value;
  for (i=0; i < data[entityID].frequentColors.length; i++) { 
	color = data[entityID].frequentColors[i];
	imageProcessed.setIntColor(0,0, color.A, color.R,color.G,color.B);
	var div = document.createElement("div");
	div.setAttribute('class', 'histEntry');
	div.setAttribute('draggable', 'true');
	div.setAttribute('id', imageProcessed.getIntColor(0,0));
	div.classList.add("tooltip2");
	div.innerHTML = "<span>"+color.count+"</span>  <span class=\"tooltiptext\">Red: "+color.R+" Green: "+color.G+" Blue: "+color.B+" Alpha: "+color.A+"</span>";
	div.style.background = "rgba("+color.R+","+color.G+","+color.B+","+color.A+")";
	document.getElementById("histogramEntity").appendChild(div);
	}
	 cols= document.querySelectorAll('.histEntry');
	[].forEach.call(cols, function(col) {
	  col.addEventListener('dragstart', handleDragStart, false);
	  col.addEventListener('dragenter', handleDragEnter, false)
	  col.addEventListener('dragover', handleDragOver, false);
	  col.addEventListener('dragleave', handleDragLeave, false);
	  col.addEventListener('drop', handleDrop, false);
	  col.addEventListener('dragend', handleDragEnd, false);
	});
	imageProcessed.setIntColor(0,0, tempColor);
}

function changeZoom(){
	scale=document.getElementById("zoomlevel").value/100;
	canvasOriginal.width = imageOriginal.getWidth()*scale;
    canvasOriginal.height = imageOriginal.getHeight()*scale;
	canvasOriginal.getContext("2d").fillStyle = "#eeeeee";
	canvasOriginal.getContext("2d").fillRect(0,0,canvasOriginal.width, canvasOriginal.height);
	var temp = new MarvinImage();
	Marvin.scale(imageOriginal, temp, canvasOriginal.width, canvasOriginal.height);
	temp.draw(canvasOriginal);
	canvas.width = imageOriginal.getWidth()*scale;
    canvas.height = imageOriginal.getHeight()*scale;
	canvas.getContext("2d").fillStyle = "#eeeeee";
	canvas.getContext("2d").fillRect(0,0,canvasOriginal.width, canvasOriginal.height);
	temp = new MarvinImage();
	Marvin.scale(imageProcessed, temp, canvasOriginal.width, canvasOriginal.height);
	temp.draw(canvas);
	
}
function clickDownload(){
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
function clickReset(){
	imageProcessed = imageOriginal.clone();
	buildHisto();
	repaint();
	
}
function imageLoaded(){
	imageProcessed = imageOriginal.clone();
	canvasOriginal.width = imageOriginal.getWidth();
    canvasOriginal.height = imageOriginal.getHeight();
	canvasOriginal.getContext("2d").fillStyle = "#eeeeee";
	canvasOriginal.getContext("2d").fillRect(0,0,canvasOriginal.width, canvasOriginal.height);
  imageOriginal.draw(canvasOriginal);
	canvas.width = imageOriginal.getWidth();
    canvas.height = imageOriginal.getHeight();
	canvas.getContext("2d").fillStyle = "#eeeeee";
	canvas.getContext("2d").fillRect(0,0,canvasOriginal.width, canvasOriginal.height);
	
	
	buildHisto();
	repaint();
}

function repaint(){
	canvas.getContext("2d").fillStyle = "#eeeeee";
	canvas.getContext("2d").fillRect(0,0,canvasOriginal.width, canvasOriginal.height);
	var temp = new MarvinImage();
	Marvin.scale(imageProcessed, temp, canvasOriginal.width, canvasOriginal.height);
	temp.draw(canvas);
	imageProcessed.update();
}
	

function clickRemoveBorder(){
  for(var y=0; y<imageOriginal.getHeight(); y++){
    for(var x=0; x<imageOriginal.getWidth(); x++){
      var red = imageOriginal.getIntComponent0(x,y);
      var green = imageOriginal.getIntComponent1(x,y);
      var blue = imageOriginal.getIntComponent2(x,y);
      var alpha = imageOriginal.getAlphaComponent(x,y);
      
      if(red <= 14 && green <= 0 && blue <=0 && alpha > 0){
        imageProcessed.setIntColor(x, y, 0, 0,0,0);
      }
    }
  }
  repaint();
	buildHisto();
  return imageProcessed.clone();
}
function evalEnvironment(img,x,y){
	return img.getAlphaComponent(x-1,y-1)+img.getAlphaComponent(x-1,y)+img.getAlphaComponent(x-1,y+1)+img.getAlphaComponent(x,y-1)+img.getAlphaComponent(x,y+1)+img.getAlphaComponent(x+1,y-1)+img.getAlphaComponent(x+1,y)+img.getAlphaComponent(x+1,y+1)+img.getAlphaComponent(x-2,y)+img.getAlphaComponent(x+2,y)+img.getAlphaComponent(x,y-2)+img.getAlphaComponent(x,y+2);
}

function clickDrawBorder(){
	var imageTemp = clickRemoveBorder();
  for(var y=0; y<imageTemp.getHeight(); y++){
    for(var x=0; x<imageTemp.getWidth(); x++){
      var red = imageTemp.getIntComponent0(x,y);
      var green = imageTemp.getIntComponent1(x,y);
      var blue = imageTemp.getIntComponent2(x,y);
      var alpha = imageTemp.getAlphaComponent(x,y);

	  if(evalEnvironment(imageTemp,x,y)>0 && alpha==0){
        imageProcessed.setIntColor(x, y, 255, 14,0,0);
	  }
    }
  }
  repaint();
	buildHisto();
}

function replaceColor(oldColor,newColor){
  for(var y=0; y<imageOriginal.getHeight(); y++){
    for(var x=0; x<imageOriginal.getWidth(); x++){
      if(imageProcessed.getIntColor(x,y)==oldColor){
        imageProcessed.setIntColor2(x, y, (newColor & 0xFF000000) >>> 24,newColor);
      }
    }
  }
  repaint();
}

var hist=[];

function buildHisto(){
  for(var y=0; y<imageProcessed.getHeight(); y++){
    for(var x=0; x<imageProcessed.getWidth(); x++){
		var all = imageProcessed.getIntColor(x,y);
      var red = imageProcessed.getIntComponent0(x,y);
      var green = imageProcessed.getIntComponent1(x,y);
      var blue = imageProcessed.getIntComponent2(x,y);
      var alpha = imageProcessed.getAlphaComponent(x,y);
	  if (alpha==0){continue;}
	  var temp= false;
		for(i=0;i<hist.length;i++){
			if (hist[i][0]==all){
				hist[i][5]++;
				temp=true;
			}
		}
	  if(!temp){
		  hist.push([all,red,green,blue,alpha,1]); 
	  }
    }
  }
  hist.sort(function(a, b){return b[5]-a[5];});
  
  var myNode = document.getElementById("histogram").innerHTML = '';
  
  for (i=0; i < hist.length; i++) { 
	var div = document.createElement("div");
	div.setAttribute('class', 'histEntry');
	div.setAttribute('draggable', 'true');
	div.setAttribute('id', hist[i][0]);
	div.classList.add("tooltip2");
	div.innerHTML = "<span>"+hist[i][5]+"</span>  <span class=\"tooltiptext\">Red: "+hist[i][1]+" Green: "+hist[i][2]+" Blue: "+hist[i][3]+" Alpha: "+hist[i][4]+"</span>";
	div.style.background = "rgba("+hist[i][1]+","+hist[i][2]+","+hist[i][3]+","+hist[i][4]+")";
	document.getElementById("histogram").appendChild(div);
	}
	 cols= document.querySelectorAll('.histEntry');
	[].forEach.call(cols, function(col) {
	  col.addEventListener('dragstart', handleDragStart, false);
	  col.addEventListener('dragenter', handleDragEnter, false)
	  col.addEventListener('dragover', handleDragOver, false);
	  col.addEventListener('dragleave', handleDragLeave, false);
	  col.addEventListener('drop', handleDrop, false);
	  col.addEventListener('dragend', handleDragEnd, false);
	});
  repaint();
}

function clickDetectCorners(){
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "#ff0000";
	var x1=0;
	var y1=0;
	var count=0;
	var x2=0;
	var y2=0;
	var count2=0;
	var width= 32;
	  for(var y=-width/2; y<=width/2; y++){
		for(var x=-width/2; x<=width/2; x++){
		  var alpha = imageProcessed.getAlphaComponent(x+width/2,y+width/2);
      var red = imageProcessed.getIntComponent0(x+width/2,y+width/2);
      var green = imageProcessed.getIntComponent1(x+width/2,y+width/2);
      var blue = imageProcessed.getIntComponent2(x+width/2,y+width/2);
		  if(alpha>0){
			  x1+=x;
			  y1+=y;
			  count++;
		  }
		  if(red==201 && green==190 && blue==203){
			  x2+=x;
			  y2+=y;
			  count2++;
		  }
		}
	  }
	ctx.fillRect(Math.floor(x1/count+width/2),Math.floor(y1/count+width/2),2,2);
	ctx.fillStyle = "#ffff00";
	ctx.fillRect(Math.floor(x2/count2+width/2),Math.floor(y2/count2+width/2),2,2);
	console.log(count+"x1:"+(x1/count+width/2)+",y1:"+(y1/count+width/2));
	console.log(count2+"x1:"+(x2/count2+width/2)+",y1:"+(y2/count2+width/2));
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
    // Set the source column's HTML to the HTML of the column we dropped on.
	replaceColor(e.dataTransfer.getData('text/id'),this.id);
	this.firstChild.innerText = Number(this.firstChild.innerText )+Number(e.dataTransfer.getData('text/html'));
	dragSrcEl.remove();
  }

  return false;
}
function handleDragEnd(e) {
  [].forEach.call(cols, function (col) {
    col.classList.remove('over');
  });
}
