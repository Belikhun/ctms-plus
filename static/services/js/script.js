$(function() {
    $(window).scroll(function(event) {
        var pos_body = $('html,body').scrollTop();
        if (pos_body > 100) {
            $('.back-to-top').addClass('show-back-page go-top sticky');
        } else {
            $('.back-to-top').removeClass('show-back-page go-top sticky');
        }
    });
    $('.back-to-top').click(function(event) {
        $('html,body').animate({
                scrollTop: 0
            },
            1400);
    });
});