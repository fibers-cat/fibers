jQuery(document).ready(function($) {

  $(".clickable-row").click(function() {
      window.location = $(this).data("href");
  });

  $('.modal').modal({
    dismissible: true, // Modal can be dismissed by clicking outside of the modal
    opacity: .5, // Opacity of modal background
    in_duration: 300, // Transition in duration
    out_duration: 200, // Transition out duration
    starting_top: '4%', // Starting top style attribute
    ending_top: '10%', // Ending top style attribute
    }
  );

  $('input#name').characterCounter();

  $("#navbar-toggle").click( function (){
    if( $('.nav-box').css('left') === '-325px' )  {
        $(".nav-box").css("left", '0px');
        $(".nav-box").css("width", '88%');
    }
    else {
      $(".nav-box").css("left", '-325px');
      $(".nav-box").css("width", '325px');
    }

  });

});

jQuery(window).resize(function () {
  var width = $(window).width();

  if (width < 600) {
    $('.legal').removeClass('tooltipped');
  }
});
