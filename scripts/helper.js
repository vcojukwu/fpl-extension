chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    setTimeout(function() {
     $('a[href^="/a/team/"]').addClass('tooltip2')
     .append(`<div class="tooltiptext">
                <h1>Played</h1>
                <table>
                  <tbody>
                    <tr><td>Hazard</td</tr>
                    <tr><td>Morata</td</tr>
                    <tr><td>Salah</td</tr>
                    <tr><td>Kane</td</tr>
                    <tr><td>Grob</td</tr>
                  </tbody>
                </table>
              </div>`);
    }, 5000);
});