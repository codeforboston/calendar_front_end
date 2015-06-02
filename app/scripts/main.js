/* jshint devel:true */
/* global moment, _ */

(function(window, document, $, _) {
  'use strict';


  // Constants

  var API = {
    // EVENTS: 'http://localhost:3000/api/v1/events?page=1&page_count=50',
    EVENTS: 'https://boston-civic-calendar.herokuapp.com/api/v1/events',
    NEW_SOURCE: 'https://boston-civic-calendar.herokuapp.com/sources/new',
  };

  // var DAYS_OF_THE_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // var DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // var today = new Date();


  // DOM stuff

  var $DOC = $(document);

  var DOM = {
    $tooltips:        $('[data-toggle="tooltip"]'),
    $newSourceLink:   $('[data-hook="new-source-link"]'),
    $main:            $('[data-hook=main]'),
    $eventsPanel:     $('[data-hook=events-panel]'),
    $errorPanel:      $('[data-hook=error-panel]'),
    $calendarList:    $('[data-hook="list-container"]'),
    $calendar:        $('[data-hook="calendar-container"]'),
    $calendarDetail:  $('[data-hook="calendar-detail"]'),
    $calendarDetailList: $('[data-hook="calendar-detail-events-list"]'),
    $hideDetail:        $('[data-hook="hide-detail"]')
  };


  function getTemplateString (idSelector) {
    return document.getElementById(idSelector).innerHTML ;
  }

  var TEMPLATES = {
    calendarList: _.template(getTemplateString('calendar-list'))
  };




  // helpers and things

  function dasherize (text) {
    return text.toLowerCase().split(' ').join('-');
  }


  function transformEventsForFC(events) {
    return events.map(function(e){
      return {
        title: e.title,
        start: moment(e.start_date),
        end: moment(e.end_date),
        url: e.url,
        editable: false,
        startEditable: false,
        durationEditable: false,
        className: dasherize(e.organizer)
      };
    });
  }

  function linkify (text) {
    return text.split(' ')
        .map(function(s){
          if(s.toLowerCase().indexOf('http') === 0) {
            return '<a href="'+s+'" target="_blank">'+s+'</a>';
          } else {
            return s;
          }
        })
        .join(' ');
  }



  function getEventsOnDate (rawEvents, queryDate) {
    return rawEvents.filter(function(event) {
      var startDate = moment(event.start_date);
      var endDate = moment(event.end_date);
      // if start or ends on this date
      if( startDate.dayOfYear() === queryDate.dayOfYear() ||
          endDate.dayOfYear() === queryDate.dayOfYear() ) {
        return true;
      }

      // if event spans over this date
      if( startDate.dayOfYear() <= queryDate.dayOfYear() &&
          endDate.dayOfYear() >= queryDate.dayOfYear() ) {
        return true;
      }

      return false;
    });
  }

  function formatEventListItemData (event) {
    var startDate = moment(event.start_date);
    var endDate = moment(event.end_date);
    var dateString;
    if( startDate.format('L') === endDate.format('L') ) {
      dateString = startDate.fromNow() + ' | ' +  startDate.format('L');
    } else {
      dateString = startDate.format('L')+' - '+endDate.format('L');
    }

    return {
            title: event.title,
            dateString: dateString,
            location: event.location,
            description: linkify(event.description)
          };
  }





// setup bootstrap stuff

DOM.$tooltips.tooltip();

DOM.$newSourceLink.attr('href', API.NEW_SOURCE);



// populate list
//

$.getJSON(API.EVENTS)
  .error(function(err){
    console.log(err);
    DOM.$errorPanel.removeClass('hidden');
  })
  .done(function(events){
    DOM.$eventsPanel.removeClass('hidden');

    var fullCalEvents = transformEventsForFC(events);

    // set up calendar
    DOM.$calendar.fullCalendar({
      events: fullCalEvents,
      theme: false,
      aspectRatio: 2,
      dayClick: function(date) {
        var eventsOnDay = getEventsOnDate(events, date);
        $DOC.trigger('calendarDetail:show', { events: eventsOnDay });
      },
      eventClick: function() {
        console.log('handle event click. show single event in pane?');

      }
    });




    var tplData = {
                    events: _.map(events, formatEventListItemData)
                  };
    var tpl = TEMPLATES.calendarList(tplData);
    DOM.$calendarList.append(tpl);

  });




  // events


  $DOC.on('calendarDetail:show', function(e, data) {
     var tplData = {
                    events: _.map(data.events, formatEventListItemData)
                  };
    var tpl = TEMPLATES.calendarList(tplData);
    DOM.$calendarDetailList.html(tpl);

    DOM.$calendarDetail.removeClass('hidden');

  });


  $DOC.on('calendarDetail:hide', function() {
    DOM.$calendarDetail.addClass('hidden');
  });


  DOM.$hideDetail.on('click', function(){
    $DOC.trigger('calendarDetail:hide');
  });

})(window, document, $, _);


