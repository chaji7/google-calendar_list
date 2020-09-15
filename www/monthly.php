<?php
  $this_day = '';
  if(!empty($_GET['date'])){
    $this_year = substr($_GET['date'],0,4);
    $this_month = substr($_GET['date'],4);
    $this_day = date('Y-m-d', mktime(0, 0, 0, $this_month, 1, $this_year));
  }else{
    $this_year = date('Y');
    $this_month = date('m');
    $this_day = date('Y-m-d');
  }
  $firstDate = date('Y-m-d', strtotime('first day of '. $this_day));
  $firstDateNum = date('j', strtotime('first day of '. $this_day));
  $lastDate = date('Y-m-d', strtotime('last day of '. $this_day));
  $lastDateNum = date('j', strtotime('last day of '. $this_day));
  $weekList = array('日', '月', '火', '水', '木', '金', '土');
  $firstWeekNum = date('w', strtotime($firstDate));
  $lastWeekNum = date('w', strtotime($lastDate));

  $prevMonth = date('Ym', strtotime($this_day.'-1 month'));
  $nextMonth = date('Ym', strtotime($this_day.'+1 month'));

  function checkDates($y,$m,$d){
    //var_dump($y.'年'.$m.'月'.$d.'日');
    $results = array();
    $results['date'] = date('Y-m-d', mktime(0, 0, 0, $m, $d, $y));
    $results['day'] = date('n/j', mktime(0, 0, 0, $m, $d, $y));
    $results['week'] = date('w', mktime(0, 0, 0, $m, $d, $y));
    return $results;
  }
?>

<!DOCTYPE html>
<html>
  <head>
    <title>カレンダーテスト(月表示)</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
    <link href="./css/style.css" rel="stylesheet">
  </head>
  <body>
    <div id="app">
      <p>カレンダーテスト(月表示)</p>

      <!--Add buttons to initiate auth sequence and sign out-->
      <button id="authorize_button" v-on:click="handleAuthClick()">Authorize</button>
      <button id="signout_button" v-on:click="handleSignoutClick()">Sign Out</button>

      <pre id="content" style="white-space: pre-wrap;"></pre>

      <h4><?php echo date('Y年n月', strtotime($this_day)); ?></h4>

      <div class="weeklinks">
        <a href="./monthly.php?date=<?php echo $prevMonth; ?>" class="prevLink">前月へ</a>
        <a href="./monthly.php" class="nowLink">今月に戻る</a>
        <a href="./monthly.php?date=<?php echo $nextMonth; ?>" class="nextLink">次月へ</a>
      </div>


      <table class="table">
        <thead>
          <tr>
            <?php foreach($weekList as $week): ?>
              <th scope="col" class="week<?php if($week=='土'){echo ' sat';}elseif($week=='日'){echo ' sun';}?>"><?php echo $week; ?></th>
            <?php endforeach; ?>
          </tr>
        </thead>
        <tbody>
          <?php
          //var_dump($lastWeekNum);
            // 1週目
            echo '<tr>';
            // 空白セル処理 or 前月入れる？
            if($firstWeekNum != 0){
              for ($i = 1; $i <= $firstWeekNum; $i++) {
                echo "<td></td>";
              }
            }
            for($i=1; $i<=$lastDateNum; $i++){
              $d = '';
              $d = checkDates($this_year, $this_month, $i);

              // 日曜日の場合
              if($d['week']==0){
                echo '<tr>';
              }

              // 日付セル
              echo '<td class="event-td" data-date="' . $d['date'] . '">'. $d['day'] .
              '<div class="event-link"></div></td>';

              // 土曜日の場合
              if($d['week']==6){
                echo '</tr>';
              }
            }
            if($lastWeekNum != 6){
              // 空白セル処理 or 次月入れる？
              $lastEmptyTd = 6 - $lastWeekNum;
              for ($i = 1; $i <= $lastEmptyTd; $i++) {
                echo "<td></td>";
              }
            }
          ?>

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
  <script src="./js/monthly.js"></script>
</html>