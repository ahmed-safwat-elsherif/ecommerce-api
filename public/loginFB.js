document.getElementsByTagName('button')[0].onclick(()=>{
    console.log("Clicked")
    FB.getLoginStatus(response =>{
        console.log(response)
    });
})