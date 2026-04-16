var tStart,tEnd;
$(document).ready(function(){
    setDimensions();
    maintainAspectRatio();
    console.log("Game Controler Initialized");
})


function maintainAspectRatio(){
    $(window).on("resize",function(){
        setDimensions();
    })
}

function setDimensions(){
    // var limit=$("body").height();
    // limit=limit * .95
    var bodyWidth=$("body").width();
    var bodyHeight=$("body").height();

    var setWidth;
    if(bodyWidth > bodyHeight && bodyHeight > (bodyWidth * .70) ){
        setWidth = bodyWidth;
    }
    else if(bodyHeight > bodyWidth){
        setWidth = bodyWidth;
    }
    
    else{
        setWidth=(bodyHeight * .43) + bodyHeight
    }
    console.log(setWidth)
    var aspectRatioObj=$("#aspect-ratio-container");
    aspectRatioObj.width(setWidth)
    var width=aspectRatioObj.width();
    //set aspect-ratio-container height to 70% size of its width
    aspectRatioObj.height(width * .70); 
    $("html,body").css("min-height",width * .75)
}


