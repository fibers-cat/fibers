<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="description" content="Tot el que necessites per aprovar, documentació, apunts i exercicis pràctics de cada assignatura."/>

  <meta name="theme-color" content="#424242"/>

  <title>Fibers | Assignatures i estat del contingut</title>

  <meta property="og:title" content="Fibers | Documents, apunts i exercicis FIB" />
  <meta property="og:description" content="Tot el que necessites per aprovar, documentació, apunts i exercicis pràctics de cada assignatura." />
  <meta property="og:image" content="assets/img/logo.png" />
  <meta property="og:type" content="website" />

  <link rel="shortcut icon" href="assets/img/logo.png"/>

  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

  <link href="assets/css/m.min.css" type="text/css" rel="stylesheet"/>
  <!-- Sass version -->
  <!-- <link href="assets/css/materialize.css" type="text/css" rel="stylesheet"/> -->
  <link href="assets/css/f-a.min.css" type="text/css" rel="stylesheet"/>
  <link href="assets/css/styles.css" type="text/css" rel="stylesheet"/>

  <script src="assets/js/jq.min.js" type="application/javascript"></script>
  <script src="assets/js/m.min.js" type="application/javascript"></script>
  <script src="assets/js/main.js" type="application/javascript"></script>

  <script type="text/javascript">
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
           m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

      ga('create', 'UA-84592115-1', 'auto');
      ga('send', 'pageview');

  </script>
</head>
<body>

  <?php include "views/layouts/_leftNavBar.php" ?>

  <section class="page">
    <div class="header">
      <?php include "views/layouts/_rightTopNavBar.php" ?>
    </div>
    <div class="header-mobile">
        <a href="/">Fibers.cat</a> <span><i id="navbar-toggle" class="fa fa-bars" aria-hidden="true"></i></span>
    </div>

    <div class="content">
              <h5  class="page-title"><span class="modal_title">Participa i aporta contingut !</span></h5>
              <br>
              <h6  class="page-sub-title">Pots enviar-nos documentació que creguis necessària per afegir a la pàgina</h6>
              <br>
              <div class="row">
                <form action="#" method="post" class="col s12">
                  <div class="row">
                    <div class="file-field input-field col s12 m6">
                      <div class="btn btn-arxius">
                        <i class="fa fa-paperclip" aria-hidden="true"></i> &nbsp;
                        <span>Arxius</span>
                        <input type="file" multiple>
                      </div>
                      <div class="file-path-wrapper">
                        <input class="file-path validate" type="text" placeholder="Adjunta un o més arxius" required>
                      </div>
                    </div>
                    <div class="input-field col s12 m6">
                      <i class="material-icons prefix">mode_edit</i>
                      <textarea id="message" class="materialize-textarea" class="validate" data-length="5000" required></textarea>
                      <label for="message">Descriu el contingut</label>
                    </div>
                  </div>
                  <br>
                  <div class="row">
                    <div class="col s12">
                      <div class="switch">
                        Vols aparèixer com usuari col.laborador a la pàgina ? &nbsp; &nbsp;
                        <label>
                          No
                          <input type="checkbox" checked="checked">
                          <span class="lever"></span>
                          Si
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="input-field col s12 l6">
                    <i class="fa fa-user-o prefix" aria-hidden="true"></i>
                      <input id="name" type="text" class="validate" data-length="25">
                      <label for="name">Nom o pseudònim</label>
                    </div>
                    <div class="input-field col s12 l6">
                      <i class="fa fa-envelope-o prefix" aria-hidden="true"></i>
                      <input id="email" type="email" class="validate">
                      <label for="email" data-error="wrong" data-success="right">Correu electrònic</label>
                    </div>
                  </div>
                  <br>
                  <div class="row">
                    <div class="input-field col s12 l6">
                      <p>
                        <input type="checkbox" class="filled-in" id="filled-in-box" required/>
                        <label for="filled-in-box">He llegit  i accepto <a href="#legal">les condicions</a></label>
                      </p>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col s12">
                      <button class="btn btn-send waves-effect waves-light" type="submit" name="action">Enviar
                        <i class="material-icons right">send</i>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

    </div>

    <div class="footer-mobile">
        <?php include "views/layouts/_footer.php" ?>
    </div>

  </section>

  <?php include "views/condicions-us.php" ?>

</body>
</html>
