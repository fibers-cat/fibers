(function($){
  $(function(){

    $('.button-collapse').sideNav({
	      menuWidth: 240, // Default is 240
	      edge: 'left', // Choose the horizontal origin
	      closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
	    }
	);

	$('.carousel').carousel({
		time_constant: 200,
		dist: -100,
		shift: 0,
		padding: 80,
		indicators: true,
		no_wrap: false
	});

	// Next slide
	$('.carousel').carousel('next');
	$('.carousel').carousel('next', 3); // Move next n times.
	// Previous slide
	$('.carousel').carousel('prev');
	$('.carousel').carousel('prev', 4); // Move prev n times.
	// Set to nth slide
	$('.carousel').carousel('set', 4);

	$(function() {
	  $('a[href*="#"]:not([href="#"])').click(function() {
	    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
	      var target = $(this.hash);
	      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
	      if (target.length) {
	        $('html, body').animate({
	          scrollTop: target.offset().top
	        }, 1000);
	        return false;
	      }
	    }
	  });
	});

	$('.modal-trigger').leanModal({
	    dismissible: true, // Modal can be dismissed by clicking outside of the modal
	    opacity: .5, // Opacity of modal background
	    in_duration: 300, // Transition in duration
	    out_duration: 200, // Transition out duration
	    starting_top: '4%', // Starting top style attribute
	    ending_top: '10%', // Ending top style attribute
	    /*
	    ready: function() { alert('Ready'); }, // Callback for Modal open
	    complete: function() { alert('Closed'); } // Callback for Modal close
	    */
	    }
	  );

	// ===== Scroll to Top ==== 
	$(window).scroll(function() {
	    if ($(this).scrollTop() >= 350) {        // If page is scrolled more than 50px
	        $('#return-to-top').fadeIn(200);    // Fade in the arrow
	    } else {
	        $('#return-to-top').fadeOut(200);   // Else fade out the arrow
	    }
	});
	$('#return-to-top').click(function() {      // When arrow is clicked
	    $('body,html').animate({
	        scrollTop : 0                       // Scroll to top of body
	    }, 500);
	});

  }); // end of document ready
})(jQuery); // end of jQuery name space

$(document).ready(function(){

   $('.button').on('click', function(e) {
      $('.popup').toggleClass("close"); 
      $('.button').toggleClass("button-closed");
      e.preventDefault();      
    });

});


