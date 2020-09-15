
/**
 *  補助用関数
 */
//対象クエリパラメータの取得
function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// 日付文字列の整形（yyyyMMの形式にして、月初の日付を返す）
function toMonth (str) {
  let arr = (str.substr(0, 4) + '/' + str.substr(4, 2)).split('/');
  return new Date(arr[0], arr[1] - 1, 1);
};

// 日付をYYYY-MM-DDの書式で返すメソッド
function formatDate(dt) {
  var y = dt.getFullYear();
  var m = ('00' + (dt.getMonth()+1)).slice(-2);
  var d = ('00' + dt.getDate()).slice(-2);
  return (y + '-' + m + '-' + d);
}

/**
 * GoogleカレンダーAPI系 
 */

// Client ID and API key from the Developer Console
let CLIENT_ID = ''; // OAuth 2.0 クライアント ID
let API_KEY = ''; // APIキー

// Array of API discovery doc URLs for APIs used by the quickstart
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
let SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

let authorizeButton = document.getElementById('authorize_button');
let signoutButton = document.getElementById('signout_button');


var app = new Vue({
  el: '#app',
  data: {
    'week_list':["日", "月", "火", "水", "木", "金", "土" ], // 曜日リスト
    'date':null, // 今日の日付を入れる
    'api': undefined, // GoogleカレンダーAPI用
    'authorized': false, // GoogleカレンダーAPI用
    'calendar_data':[], // GoogleカレンダーAPIで取得したイベントデータをまとめて入れる
  },
  created: function () {
    // 日付の初期値(クエリがついている場合はそれに従う)
    if(getParam('date')){
      this.date = new Date(toMonth(getParam('date')));
    }else{
      temp_date = new Date();
      this.date = new Date(temp_date.getFullYear(), temp_date.getMonth(), temp_date.getDate());
    }
    // GoogleカレンダーAPI宣言、呼び出し
    this.api = gapi;
    this.handleClientLoad();
  },
  mounted: function (){

  },
  methods:{
    /////////////////////////////// GoogleカレンダーAPIたち_Start /////////////////////////////////////////////
    /**
     *  On load, called to load the auth2 library and API client library.
     */
    handleClientLoad() {
      this.api.load('client:auth2', this.initClient);
    },
    /**
     *  Initializes the API client library and sets up sign-in state
     *  listeners.
     */
    initClient() {
      let vm = this;
      vm.api.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(function () {
        // Listen for sign-in state changes.
        vm.api.auth2.getAuthInstance().isSignedIn.listen(vm.authorized);
        // Handle the initial sign-in state.
        vm.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      }, function(error) {
        vm.appendPre(JSON.stringify(error, null, 2));
      });
    },
    /**
     *  Called when the signed in status changes, to update the UI
     *  appropriately. After a sign-in, the API is called.
     */
    updateSigninStatus(isSignedIn) {
      let vm = this;
      if (isSignedIn) {
        // 認証&サインアウトボタン表示/非表示
        $('#authorize_button').hide();
        $('#signout_button').show();

        vm.listUpcomingEvents();

      } else {
        // 認証&サインアウトボタン表示/非表示
        $('#authorize_button').show();
        $('#signout_button').hide();
      }
    },
    /**
     *  Sign in the user upon button click.
     */
    handleAuthClick(event) {
      let vm = this;
      vm.api.auth2.getAuthInstance().signIn();
    },
    /**
     *  Sign out the user upon button click.
     */
    handleSignoutClick(event) {
      let vm = this;
      if (window.confirm("サインアウトしてもよろしいですか")) { 
        if(vm.api.auth2.getAuthInstance().signOut()){
          location.reload();
        }
      }
    },
    /**
     * Append a pre element to the body containing the given message
     * as its text node. Used to display the results of the API call.
     *
     * @param {string} message Text to be placed in pre element.
     */
    appendPre(message) {
      let pre = document.getElementById('content'),
          textContent = document.createTextNode(message + '\n');
      pre.appendChild(textContent);
    },
    /**
     * Print the summary and start datetime/date of the next ten events in
     * the authorized user's calendar. If no events are found an
     * appropriate message is printed.
     * 対象アカウントのカレンダー情報取得用で、この処理だけ手を加えている
     */
    listUpcomingEvents() {
      let vm = this;
      let min_date = new Date(vm.date);
      min_date.setDate(1);
      let max_date = new Date(vm.date);
      max_date.setDate(1);
      max_date.setMonth(max_date.getMonth()+1);
      max_date.setDate(0);
      max_date.setHours(23);
      max_date.setMinutes(59);
      max_date.setSeconds(59);
      // 対象月のみを期間指定してデータ取得
      vm.api.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (min_date).toISOString(),
        'timeMax': (max_date).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        //'maxResults': 100, // timeMinとtimeMaxで期間指定しているので、データ取得上限は不要
        'orderBy': 'startTime'
      }).then(function(response) {
        let events = response.result.items;
        let results = [];
        events.filter(function (event) {
          if(event.start.dateTime){
            results.push([
              {'date':formatDate(new Date(event.start.dateTime))},
              event
            ]);
          }
          if(event.start.date){
            results.push([
              {'date':event.start.date},
              event
            ]);
          }
        });
        //console.log(results); 
        //vm.calendar_data.push(results);
        vm.calendar_data = results;
        vm.dateCheck();
      });
    },
    /////////////////////////////// GoogleカレンダーAPIたち_End /////////////////////////////////////////////

    // Viewに表示する日付のフォーマットを変える用
    dateFormat(num,format){
      let vm = this;
      let this_date = new Date(vm.date);
      if(num){
        this_date.setDate(this_date.getDate() + num);
      }
      let this_year = this_date.getFullYear(),
          this_month = this_date.getMonth()+1,
          this_week = this_date.getDay(),
          this_day = this_date.getDate();
      
      let date_data = '';
      if(format == 'd'){
        // dd日（土） tableの見出し行用
        date_data = this_day + '日' + '（' + vm.week_list[this_week] + '）';
      } else if(format == 'ym'){
        // yyyymm 前月・次月のaタグのクエリパラメータ用
        date_data = this_year + this_month.toString().padStart(2, '0');
      } else if(format == 'y-m'){
        // yy年mm月dd日（土） h4見出し用
        date_data = this_year + '年' + this_month + '月';
      }
      return date_data;
    },
    // 
    dateCheck(){
      let vm = this;
      tds = $('.event-td');
      tds.each(function(){
        // yyyy-mm-dd
        td_date = $(this).data('date');
        // m/d
        temp_date = new Date(td_date);
        temp_month = temp_date.getMonth()+1,
        temp_day = temp_date.getDate();
        td_date_md = temp_month + '/' + temp_day;

        temp_data = '';
        temp_data += '<div class="headDate">' + td_date_md + '</div>';
        vm.calendar_data.filter(function (dt) {
          data = dt[1];
          //console.log(data);
          if(td_date == dt[0].date){
            //console.log(data);
            // 時間単位データの場合はタイトルに時間の範囲を入れる
            if(data.start.dateTime){
              this_startTime = new Date(data.start.dateTime);
              let start_hour = this_startTime.getHours();
              let start_minute = this_startTime.getMinutes().toString().padStart(2, '0');
              this_endTime = new Date(data.end.dateTime);
              let end_hour = this_endTime.getHours();
              let end_minute = this_endTime.getMinutes().toString().padStart(2, '0');
              //this_title = start_hour+':'+start_minute + '~' + end_hour+':'+end_minute + ' ' + data.title;
              this_title = data.summary;
              // リンク生成
              temp_data += start_hour+':'+start_minute + '~' + end_hour+':'+end_minute + '<br><a href="' + data.htmlLink + '" target="_blank">' + this_title + '</a><br>';
            }else{
              this_title = data.summary;
              // リンク生成
              temp_data += '<a href="' + data.htmlLink + '" target="_blank">' + this_title + '</a><br>';
            }
          }
        });
        //console.log(temp_data);
        $(this).html(temp_data);
      });
     
      
    },
    // 日付マッチング用
    dateMatch(date1, date2) {
      let year1 = date1.getFullYear(),
          month1 = date1.getMonth() + 1,
          day1 = date1.getDate();
    
      let year2 = date2.getFullYear(),
          month2= date2.getMonth() + 1,
          day2 = date2.getDate();
    
      if (year1 == year2) {
        if (month1 == month2) {
          if (day1 == day2) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }
})

