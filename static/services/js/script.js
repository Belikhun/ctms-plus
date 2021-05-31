$(function() {
	$(window).scroll(function(event) {
		var pos_body = $('html,body').scrollTop();
		var pos_pa2 = $('.pa-body .pa-word:nth-child(2)').offset().top; 
		var pos_pa3 = $('.pa-body .pa-word:nth-child(3)').offset().top; 

        console.log(pos_pa2);
		if(pos_body>600){
			$('.back-to-top').addClass('show-back-page');
		}
		else{
			$('.back-to-top').removeClass('show-back-page');
		}
	});
    if(pos_body)
	$('.back-to-top').click(function(event) {
		$('html,body').animate({
			scrollTop: 0},
			1400);
	});
});