<!DOCTYPE html>
<html>
  <head>
    <title>カレンダーテスト</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
    <link href="./css/style.css" rel="stylesheet">
  </head>
  <body>
    <div id="app">
      <p>カレンダーテスト</p>

      <!--Add buttons to initiate auth sequence and sign out-->
      <button id="authorize_button" v-on:click="handleAuthClick()">Authorize</button>
      <button id="signout_button" v-on:click="handleSignoutClick()">Sign Out</button>

      <pre id="content" style="white-space: pre-wrap;"></pre>

      <h4>{{ dateFormat(null,'y-m-d') }}</h4>
      <div class="weeklinks" v-html="weekLink()"></div>
      <table class="table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col" class="week">{{ dateFormat(null, 'd') }}</th>
            <th scope="col" class="week" v-for="n of 6" :key="n">{{ dateFormat(n, 'd') }}</th>
          </tr>
        </thead>
        <tbody v-for="job in members">
          <tr v-for="member in job">
            <th scope="row">{{ member.name }}</th>
            <td>
              <div class="event-link" v-html="dataCheck(null, member.path)"></div>
            </td>
            <td v-for="n of 6" :key="n">
              <div class="event-link" v-html="dataCheck(n, member.path)"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
  <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js" integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <script src="https://apis.google.com/js/api.js"></script>
  <script src="./js/script.js"></script>
</html>