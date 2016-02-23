/* jshint devel:true */
/* global moment, _ */

(function(window, document, $, _) {
  'use strict';


  // Constants

  var API = {
    // EVENTS: 'http://localhost:3000/api/v1/events?page=1&page_count=50',
    EVENTS: 'https://boston-civic-calendar.herokuapp.com/api/v1/events',
    NEW_EVENT: 'https://boston-civic-calendar.herokuapp.com/events/new',
  };

  // var DAYS_OF_THE_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // var DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  var TODAY = new Date();


  // DOM stuff

  var $DOC = $(document);

  var DOM = {
    $tooltips: $('[data-toggle="tooltip"]'),
    $newSourceLink: $('[data-hook="new-event-link"]'),
    $main: $('[data-hook=main]'),
    $eventsPanel: $('[data-hook=events-panel]'),
    $errorPanel: $('[data-hook=error-panel]'),
    $calendarList: $('[data-hook="list-container"]'),
    $calendar: $('[data-hook="calendar-container"]'),
    $calendarDetail: $('[data-hook="calendar-detail"]'),
    $calendarDetailList: $('[data-hook="calendar-detail-events-list"]'),
    $hideDetail: $('[data-hook="hide-detail"], [data-hook="pane-dim"]'),
    $listingTab: $('[data-toggle="tab"][href="#listing"]'),
    $calendarTab: $('[data-toggle="tab"][href="#calendar"]'),
  };


  function getTemplateString(idSelector) {
    return document.getElementById(idSelector).innerHTML;
  }

  var TEMPLATES = {
    calendarList: _.template(getTemplateString('calendar-list'))
  };



  // helpers and things

  function dasherize(text) {
    return text.toLowerCase().split(' ').join('-');
  }


  function transformEventsForFC(events) {
    return events.map(function(e) {
      return {
        title: e.title,
        start: moment(e.start_date),
        end: moment(e.end_date),
        organizer: e.organizer,
        url: e.url,
        editable: false,
        startEditable: false,
        durationEditable: false,
        className: dasherize(e.organizer)
      };
    });
  }

  function linkify(text) {
    return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
  }



  function getEventsOnDate(rawEvents, queryDate) {
    return rawEvents.filter(function(event) {
      var startDate = moment(event.start_date);
      var endDate = moment(event.end_date);
      // if start or ends on this date
      if (startDate.dayOfYear() === queryDate.dayOfYear() ||
        endDate.dayOfYear() === queryDate.dayOfYear()) {
        return true;
      }

      // if event spans over this date
      if (startDate.dayOfYear() <= queryDate.dayOfYear() &&
        endDate.dayOfYear() >= queryDate.dayOfYear()) {
        return true;
      }

      return false;
    });
  }

  function formatEventListItemData(event) {
    var startDate = moment(event.start_date);
    var endDate = moment(event.end_date);
    var dateString;
    if (startDate.format('L') === endDate.format('L')) {
      dateString = startDate.fromNow() + ' | ' + startDate.format('L');
    } else {
      dateString = startDate.format('L') + ' - ' + endDate.format('L');
    }

    return {
      title: event.title,
      organizer: event.organizer,
      dateString: dateString,
      location: event.location,
      description: linkify(event.description)
    };
  }


  function setBestView() {
    var width = document.documentElement.clientWidth;
    if (width < 650) {
      DOM.$listingTab.tab('show');
    } else {
      DOM.$calendarTab.tab('show');
    }
  }



  // setup bootstrap stuff

  DOM.$tooltips.tooltip();

  DOM.$newSourceLink.attr('href', API.NEW_EVENT);



  // populate list
  //

  $.getJSON(API.EVENTS)
    .error(function(err) {
      console.log(err);
      DOM.$errorPanel.removeClass('hidden');
    })
    .done(function(events) {
      DOM.$eventsPanel.removeClass('hidden');

      var fullCalEvents = transformEventsForFC(events);

      // set up calendar
      DOM.$calendar.fullCalendar({
        events: fullCalEvents,
        theme: false,
        aspectRatio: 2,
        header: {
          left: 'title',
          center: 'month,agendaWeek,agendaDay',
          right: 'today prev,next'
        },
        dayClick: function(date) {
          var eventsOnDay = getEventsOnDate(events, date);
          $DOC.trigger('calendarDetail:show', {
            events: eventsOnDay
          });
        },
        eventClick: function(event) {
          // TODO: this pulls day1 of multi-day events which is wrong if you click on another day... meh. fix soon.
          var eventsOnDay = getEventsOnDate(events, event._start);
          $DOC.trigger('calendarDetail:show', {
            events: eventsOnDay
          });
          return false;
        },
        eventMouseover: function(event) {
          $(this).tooltip({
            title: event.title + ' <br/> ' + event.organizer,
            html: true
          });
          $(this).tooltip('show');
        },
        eventMouseout: function() {
          $(this).tooltip('hide');
          $(this).tooltip('destroy');
        }
      });



      var upcomingEvents = _.chain(events).filter(function(event) {
        return moment(TODAY).isBefore(event.start_date);
      }).sortBy('start_date').value();


      var tplData = {
        events: _.map(upcomingEvents, formatEventListItemData)
      };
      var tpl = TEMPLATES.calendarList(tplData);
      DOM.$calendarList.append(tpl);

    });



  // events


  $DOC.on('calendarDetail:show', function(e, data) {
    var tplData = {
      events: _.map(data.events, formatEventListItemData)
    };
    if (tplData.events.length) {
      var tpl = TEMPLATES.calendarList(tplData);
      DOM.$calendarDetailList.html(tpl);
      DOM.$calendarDetail.removeClass('hidden');
    }

  });


  $DOC.on('calendarDetail:hide', function() {
    DOM.$calendarDetail.addClass('hidden');
  });


  DOM.$hideDetail.on('click', function() {
    $DOC.trigger('calendarDetail:hide');
  });



  $(window).on('load resize', _.debounce(function() {
    setBestView();
  }, 500));

})(window, document, $, _);
