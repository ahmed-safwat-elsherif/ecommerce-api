document.getElementsByTagName('button')[0].onclick(()=>{
    FB.getLoginStatus(response =>{
        console.log(response)
    });
})