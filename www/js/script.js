
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

// 日付文字列の整形（yyyyMMddの形式にする）
function toDate (str) {
  let arr = (str.substr(0, 4) + '/' + str.substr(4, 2) + '/' + str.substr(6, 2)).split('/');
  return new Date(arr[0], arr[1] - 1, arr[2]);
};

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
    'job_list':['director','management','writer','programmer','frontend','designer'], // 職種リスト
    'date':null, // 今日の日付を入れる
    'members':null, // jsonデータを入れる
    'api': undefined, // GoogleカレンダーAPI用
    'authorized': false, // GoogleカレンダーAPI用
    'calendar_data':[], // GoogleカレンダーAPIで取得したイベントデータをまとめて入れる
  },
  created: function () {
    // 日付の初期値(クエリがついている場合はそれに従う)
    if(getParam('date')){
      this.date = new Date(toDate(getParam('date')));
    }else{
      temp_date = new Date();
      this.date = new Date(temp_date.getFullYear(), temp_date.getMonth(), temp_date.getDate());
    }
    // メンバー一覧のjson読み込み
    axios.get("./json/member.json").then(response => (this.members = response.data))
    // GoogleカレンダーAPI宣言、呼び出し
    this.api = gapi;
    this.handleClientLoad();
  },
  mounted: function (){
    // table見出し行が土日の場合に色付け
    $('.week').each(function() {
      text = $(this).text();
      if(text.match(/（土）/)){
        $(this).addClass("sat");
      } else if(text.match(/（日）/)) {
        $(this).addClass("sun");
      }
    });
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

        $.each(vm.members, function(i){
          job_array = $(this);
          $.each(job_array, function(j){
            member = $(this)[0];
            vm.listUpcomingEvents(member);
          });
        });

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
    listUpcomingEvents($member) {
      let vm = this;
      let min_date = new Date(vm.date);
      let max_date = new Date(vm.date);
      max_date.setDate(max_date.getDate() + 7);
      // 対象週のみを期間指定してデータ取得
      vm.api.client.calendar.events.list({
        'calendarId': $member.path,
        'timeMin': (min_date).toISOString(),
        'timeMax': (max_date).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        //'maxResults': 100, // timeMinとtimeMaxで期間指定しているので、データ取得上限は不要
        'orderBy': 'startTime'
      }).then(function(response) {
        let events = response.result.items;
        let results = [];
        results = [$member.path];
        if (events.length > 0) {
          // カレンダーデータがある場合、カレンダーデータを配列に含む
          results = [
            {'path':$member.path},
            events
          ];
          vm.calendar_data.push(results);
        } else {
          // カレンダーデータが無い場合、メンバーの情報のみ配列に含む
          results = [
            {'path':$member.path}
          ];
          vm.calendar_data.push(results);
        }
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
      if(format == 'y-m-d'){
        // yy年mm月dd日（土） h4見出し用
        date_data = this_year + '年' + this_month + '月' + this_day + '日' + '（' + vm.week_list[this_week] + '）';
      } else if(format == 'd'){
        // dd日（土） tableの見出し行用
        date_data = this_day + '日' + '（' + vm.week_list[this_week] + '）';
      } else if(format == 'ymd'){
        // yyyymmdd 前週・次週のaタグのクエリパラメータ用
        date_data = this_year + this_month.toString().padStart(2, '0')  + this_day.toString().padStart(2, '0');
      }
      return date_data;
    },
    // カレンダー日付と対象データの日付のマッチング用
    // マッチしたら配列に追加
    dataCheck(num, user){
      let vm = this;
      let date = new Date(vm.date);
      if(num){
        date.setDate(date.getDate() + num);
      }
      //マッチしたデータを取得する
      var date_data = [];
      vm.calendar_data.filter(function (member) { 
        if(member[0].path == user){
          if(member[1]){
            member[1].filter(function (schedule){
              if(schedule.start.date){
                // 終日データの場合
                this_date = new Date(schedule.start.date);
                if(vm.dateMatch(date, this_date)){
                  date_data.push({
                    'link':schedule.htmlLink,
                    'title':schedule.summary,
                    'start':schedule.start.date,
                    'end':schedule.end.date
                  });
                }
              } else if(schedule.start.dateTime){
                // 時間単位データの場合
                this_date = new Date(schedule.start.dateTime);
                if(vm.dateMatch(date, this_date)){
                  date_data.push({
                    'link':schedule.htmlLink,
                    'title':schedule.summary,
                    'startTime':schedule.start.dateTime,
                    'endTime':schedule.end.dateTime
                  });
                }
              }
            });
          }
        }
      });
      if(!Object.keys(date_data).length){
        // データが空の場合はnullに設定
        date_data = null;
      }else{
        // データがある場合
        temp_data = '';
        date_data.filter(function (data) {
          // 時間単位データの場合はタイトルに時間の範囲を入れる
          if(data.startTime){
            this_startTime = new Date(data.startTime);
            let start_hour = this_startTime.getHours();
            let start_minute = this_startTime.getMinutes().toString().padStart(2, '0');
            this_endTime = new Date(data.endTime);
            let end_hour = this_endTime.getHours();
            let end_minute = this_endTime.getMinutes().toString().padStart(2, '0');
            //this_title = start_hour+':'+start_minute + '~' + end_hour+':'+end_minute + ' ' + data.title;
            this_title = data.title;
            // リンク生成
            temp_data += start_hour+':'+start_minute + '~' + end_hour+':'+end_minute + '<br><a href="' + data.link + '" target="_blank">' + this_title + '</a><br>';
          }else{
            this_title = data.title;
            // リンク生成
            temp_data += '<a href="' + data.link + '" target="_blank">' + this_title + '</a><br>';
          }
        });
        date_data = temp_data;
      }

      return date_data;
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
    },
    // 前週次週のリンク生成用
    weekLink(){
      let vm = this;
      prevWeek = vm.dateFormat(-7,'ymd');
      nextWeek = vm.dateFormat(7,'ymd');
      weeklink = '<a href="./?date=' + prevWeek + '" class=prevLink">前週へ</a>' +
      '<a href="./" class="todayLink">今日に戻る</a>' +
      '<a href="./?date=' + nextWeek + '" class="nextLink">次週へ</a>';
      return weeklink;
    }
  }
})

