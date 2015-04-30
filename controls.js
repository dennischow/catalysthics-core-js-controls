include("./api/dateAPI.js");
include("./js/request/eventStoryRQ.js");

/* Global Variables */
var newsFeed;
var getscrollBatWidth = scrollBarMeasurement();


/* Window Events */
$(window).on('load',function(e){
	control.init();
}).on('resize',function(e){
	updateWindowData();
}).on('scroll',function(e){
	updateWindowData();
});

/* Document Events */
$(document).on('ready',function(e){
	updateWindowData();
	// Dependence
	// Detect Safari Browser
	if( currentAgent.match('safari') ) {
		$("BODY").addClass('safari');
	}
	// Detect Chrome Browser
	if( currentAgent.match('chrome') ) {
		$("BODY").removeClass('safari').addClass('chrome');
	}

	$("BODY").addClass('lock-scroll-x');

	// Local
	// storiesBtn.init();
	// tileStoryObj.update()();
	// audioAPI.resetAll('init');

	// Empty Dummy Markups
	$('.content-container.tileStory').empty();
	$("#create-story-modal .storybook-list UL").empty();
	$("#create-story-modal .event-new-post .block-list.checkable-list").empty();
	$("#story-container.newsfeed .sidebar").empty();
	$("#user-header .main-nav .search-display UL").empty();

	// // Development
	include("./js/request/searchRQ.js");
	include("./js/pojo/profile.js");
	include("./js/pojo/event.js");
	include("./js/request/friendRQ.js");
	include("./js/request/storyRQ.js");
	include("./js/request/eventRQ.js");
	include("./js/utils/contentUtils.js");
	include("./js/api/audioAPI.js");

});

var control = {
	init : function(){
			userHeader.init();
            shareStoryModal.init();
            shareEventModal.init();
            spinnerModal.init();
            createStoryModal.init();
            editStoryModal.init();		
            storybookListModal.init();
            lightboxModal.init();
            
	        
    		$.when( profileAPI.ready ).done(function(){
    	        if(typeof(notify) !== 'undefined')
    	        notify.init(profileAPI.getProfile().id);
    		});
    	    
            if(typeof(imFrame) !== 'undefined')
            imFrame.init();
    	}
};

/* Update Window Data */
function updateWindowData(){
	getScrollTop = $(window).scrollTop();
	getWindowHeight = $(window).height();
	getScrollBottom = getScrollTop + getWindowHeight;
}

/* Get Scrollbar Width */
function scrollBarMeasurement() {
	var scrollbarmeasure = document.createElement('DIV');
	$(scrollbarmeasure).appendTo("BODY").css({"display":"block","position":"absolute","height":"500px","width":"50px","overflow":"scroll","visibility":"hidden"});
	var scrollBarWidth =  Math.abs(scrollbarmeasure.offsetWidth - scrollbarmeasure.clientWidth);
	$(scrollbarmeasure).remove();
	return scrollBarWidth;
};

/* Loggeg in */
function switch_logToStory(newsfeed,filter){
	appendStory(newsfeed);
	createEffects(filter);
}
function appendStory(newsfeed,filter){
	var storyList = drawNewsfeed( newsfeed );
	$(storyList).each(function(i,e){
		$('.content-container.tileStory').append( e );
	});
	storiesBtn.init();

	$(".para.lazy:not(.initialized,.lazy-loaded)").lazyload({
		effect : 'fadeIn',
		threshold : 200,
 		skip_invisible : false,
		load : function(){
			$(this).addClass('lazy-loaded');
		}
	}).addClass('initialized');

	tileStoryObj.update();
	audioAPI.resetAll('init');
	loadInProgress.disable();
}
function createEffects(newsfeed,filter){
	// storyDetailsFrame
	$(".storyDetailsFrame").colorbox({
		transition :'fade',
		fastIframe : false,
		iframe : true, 
		closeButton : false,
		fixed : true, 
		width : "100%", 
		height : "100%",
		scrolling:false,
		onOpen:function() { 
			$("body").css("overflow", "hidden"); 
			$('#colorbox').css({'top':0, 'position':'fixed'});
			$('.body').css("margin-top","16px"); // just used for story dialog 
			$("#cboxLoadedContent").css("height",$(window).height()); 
                        $("#cboxOverlay:first").css({'background':'',"opacity":'0.9'});
                        $("#cboxOverlay").addClass("first_box");
                        
        },
		onComplete: function() {
                    $("#cboxLoadedContent .cboxIframe").css('background', 'none transparent');
                    $("#cboxContent").css('background', 'none transparent');
                    $("#cboxLoadedContent").css('background', 'none transparent');
                },
		onCleanup:function(){$("body").css("overflow", "");}
    });
    $(".storyEditFrame").colorbox({
                transition :'fade',
                fastIframe : false,
                iframe : true, 
                closeButton : true,
                fixed : true, 
                width : '660px', 
                height : '470px',
                scrolling:false,
                onOpen:function() { 
                        $("body").css("overflow", "hidden"); 
                        $('#colorbox').css({'top':0, 'position':'fixed'});
                        $('#colorbox #cboxContent').css("margin-top","0px");
                        $("#cboxLoadedContent").css("height",$(window).height());                    
                },
                onComplete: function() { $("#cboxLoadedContent .cboxIframe").css('background', '#000');},
                onCleanup:function(){$("body").css("overflow", "");},
                onClosed: function(e){
                    //console.log(e); window.reload(); 
                }
    });

	sidebarCalendar.update();
	if(filter){storylineController.applyFiltering();}
}



/*******************************************************************************
Story Siderbar Manet & Track
*******************************************************************************/
var sidebarCalendar = {
	debug : false,
	scrollable : false,
	tileContainer : false,
	utcAttr : false,
	init : function(){
		sidebarCalendar.scrollControl();
		this.tileContainer = $('.tileStory');
	},
	update : function(){
		// Target Elements
		var elementForCheck = $('.tileStory > .story');
		var sidebar = $('.sidebar');
		var subCalendar = $('.calendar', sidebar);

		var story_data_date = '';
		var story_date_obj = [];
		var lock = false;
		var cleanExtra = true;

		sidebarCalendar.scrollable = false;
		if( sidebarCalendar.debug ) console.log( 'Calendar Scroll Disabled' );

		// Remove all Manet
		elementForCheck.removeAttr('data-manet');

		// Init data-full-date attribute
		var getFullDateAttr = function(storyItem){
			// console.log( storyItem.attr('data-utc-time') );

			if( $('.tileStory').hasClass('newsfeed') ){
				sidebarCalendar.utcAttr = 'data-utc-time-created';
				if( sidebarCalendar.debug ) console.log('Newsfeed Page - Calendar should read News Create Time');
			}
			if( $('.tileStory').hasClass('discover') ){
				sidebarCalendar.utcAttr = 'data-utc-time-begin';
				if( sidebarCalendar.debug ) console.log('Discover Page - Calendar should read Dsicover Begin Time');
			}
			if( $('.tileStory').hasClass('storyline') ){
				sidebarCalendar.utcAttr = 'data-utc-time-end';
				if( sidebarCalendar.debug ) console.log('Storyline Page - Calendar should read Storyline End Time');
			}

			var thisUTCTime = new Date( parseInt( storyItem.attr( sidebarCalendar.utcAttr )) );

			storyItem.attr({
				'data-full-date' : thisUTCTime.into(''),
				'data-year' : thisUTCTime.fullYear(), 
				'data-month' : thisUTCTime.month(), 
				'data-date' : thisUTCTime.date(), 
				'data-day' : thisUTCTime.day()
			});
			if( sidebarCalendar.debug ) console.log(thisUTCTime);
		}

		// Remove same level current element
		var calendarRemoveExtra = function(){
			if( cleanExtra == true ){
				$('.sidebar .calendar').each(function(i,e){
					var prevElement = $('.sidebar .calendar').eq(i-1);
					var nextElement = $('.sidebar .calendar').eq(i+1);
					var currentElement = $('.sidebar .calendar').eq(i);
					var currentElementTop = parseInt( $(currentElement).attr('data-offset-top') );
					var prevElementBottom = parseInt( $(prevElement).attr('data-offset-bottom') );
					var range = 10;

					if( (currentElementTop - prevElementBottom) < range ){
						if( sidebarCalendar.debug ) console.log( $(currentElement).attr( sidebarCalendar.utcAttr ) );
						$(currentElement).remove();
					}

				});
			}
			$('.sidebar .calendar').removeClass('hide')
		}

		// Sub Calendar Position
		var calendarPosition = function(){
			subCalendar.remove();
			setTimeout(function(){
				var today = new Date();
				$('.tileStory > .story[data-manet="true"]').each(function(i,e){

					var storyItemTop = $(this).offset().top;
					var storyItemFullDate = $(this).attr('data-full-date');
					var storyItemDate = new Date( parseInt( $(this).attr( sidebarCalendar.utcAttr ) ));
					// console.log(storyItemTop);

					var thisCalendar = $('.sidebar .calendar[data-full-date="' + storyItemFullDate + '"]');

					var thisCalendarHeight = thisCalendar.height(); // Testing
					var thisCalendarBottom = storyItemTop + thisCalendarHeight; //Testing

					thisCalendar.css({
						position : 'absolute',
						top : storyItemTop
					}).attr({
						'data-offset-top' : storyItemTop,
						'data-height' : thisCalendarHeight,
						'data-offset-bottom' : thisCalendarBottom // Testing
					});

					// Compare date of today
					// console.log( today + ' : ' + storyItemDate + ' : ' +  today.inSameDateAs(storyItemDate) );
					if( today.inSameDateAs(storyItemDate) ){
						$(thisCalendar).find('.date').text('Today');
						// console.trace();
						$(thisCalendar).find('.month').text( today.getDate() + ' ' + today.monthNameFull() );
						if( sidebarCalendar.debug ) console.log( 'Calendar ** found Today **' );
					}

				});

				calendarRemoveExtra();

				// IF this is the public Story page, then draw callendar with extra attributes
				if( $(".tileStory").length > 0 ){
					sidebarCalendar.scrollable = true;
					if( sidebarCalendar.debug ) console.log( 'Calendar Scroll Enabled' );
					sidebarCalendar.sidebarTrack();
					// $(window).trigger('resize');
				}

			},1000);
		}

		// Apply manet attribute to story
		var addManet = function(storyItem){
			
			// Add manet to first story of each date group
			// Now using array to select element to do manipulate
			$(story_date_obj).each(function(i,e){
				$('.tileStory > .story[data-full-date="' + story_date_obj[i]['full-date'] + '"]').eq(0).attr("data-manet",true);
			});
		}
		// Draw calendar as sub into sidebar
		var drawCalendar = function(){

			// story_date_obj[i][ value ]
			// value reference back to 'full-date, year, month, monthName, date'
			$(story_date_obj).each(function(i,e){
				
				//if( i > 0 ){ // Filter the first sub calendar
					var calendar = '<div class="calendar group hide" data-full-date="' + story_date_obj[i]['full-date'] + '">';
						calendar += '<div class="date-box">';
						calendar += '<p class="date">'+ story_date_obj[i]['date'] +'</p>';
						calendar += '<p class="month">' + story_date_obj[i]['monthName'] + '</p>';
						calendar += '<p class="day">' + story_date_obj[i]['day'] + '</p>';
						calendar += '</div>';
						calendar += '</div>';
					sidebar.append( calendar );
				//}
			});

			// To prevent -1 index
			var calendarFix = $('<div class="calendar" />');
			sidebar.append( calendarFix );

			// Remove the first sub calendar
			// sidebar.find('.calendar.sub[data-full-date="' + story_date_obj[0]['full-date'] + '"]').remove();
		}

		var checkStage = function(thisFullDate, storyItem){
			if( thisFullDate == story_data_date ){
				lock = true;
			}else{
				// addManet(storyItem);
				lock = false;
			}	
		}

		// Find data for each selected item
		elementForCheck.each(function(i,e){ 

			var storyItem = $(e);

			getFullDateAttr(storyItem); // Process all the attribute before all the action below

			var thisFullDate 	= $(e).attr('data-full-date'),
				thisYear 		= $(e).attr('data-year'),
				thisMonth 		= $(e).attr('data-month'),
				thisMonthName 	= dateAPI.month_name_full[ thisMonth ], // Using Time Variable 
				thisDate 		= $(e).attr('data-date');
			var thisDay 		= dateAPI.day_name_full[ parseInt($(e).attr('data-day')) ];

			// check if attribute data-full-date found more than once, return ture or false
			checkStage( thisFullDate, storyItem ); 

			if( lock == false ){ 
				story_data_date = thisFullDate; // Important for array object
				var newObj = {
					'full-date' : story_data_date,
					'year' : thisYear,
					'month' : thisMonth,
					'monthName' : thisMonthName,
					'date' : thisDate, 
					'day' : thisDay,
				}
				story_date_obj.push(newObj);
			}

		});

		addManet();

		// IF this is the public Story page, then draw callendar with extra attributes
		if( $("#story-container").length > 0 ){
			drawCalendar();
			calendarPosition();
		}

		// if( sidebarCalendar.debug )  console.log( story_date_obj );
		if( sidebarCalendar.debug ) console.log('sidebarCalendar_manet() has found ' + story_date_obj.length + ' different date group');

	},
	sidebarTrack : function(){
		if(sidebarCalendar.scrollable == false){
			return false;
		}

		// var offsetTop = 58;
		var offsetTop = 88;
		var storylineExtend = 0;
		if( $("#storyline-profile").length > 0 ){
			offsetTop = 152;
			if( $("#storyline-profile").hasClass('friend-list-show') ){
				storylineExtend = 48;
			}
		}

		var calanderCount = $('.sidebar .calendar').length;
		var cleanExtra = true;
		$('.sidebar .calendar').each(function(i,e){

			var prevElement = $('.sidebar .calendar').eq(i-1);
			var nextElement = $('.sidebar .calendar').eq(i+1);

			// Order mater
			// This
			var this_original_top = parseInt( $(this).attr('data-offset-top') );
			var this_original_bottom = parseInt( $(this).attr('data-offset-bottom') );
			var this_current_height = parseInt( $(this).attr('data-height') );
			var this_current_top = this_original_top - getScrollTop;
			var this_current_bottom = this_current_top + getScrollTop;

			if( this_current_top + storylineExtend <= offsetTop + storylineExtend ){
				$(this).removeAttr('style').css({
					position : 'fixed',
					top : offsetTop + storylineExtend
				});
			}else{
				$(this).removeAttr('style').css({
					position : 'absolute',
					top : this_original_top
				});
			}
			
			if( this_current_top - 130 <= offsetTop ){
				$(prevElement).addClass('hide');
			}else{
				$(prevElement).removeClass('hide');
			}

		});
	},
	scrollControl : function(){
		$(window).on('scroll resize', function(){
			if( $(".tileStory").length > 0 ){
				sidebarCalendar.sidebarTrack();
			}
		});
	}
}
sidebarCalendar.init(); // Execute



/*******************************************************************************
Tiles Story Layout - Work with flipBookObj
*******************************************************************************/
var tileStoryObj = {
	root : false,
	tile : false,
	update : function(){
 		this.root = $('.tileStory');
 		this.tile = $('.story', this.root);

 		// FlipBook init
 		flipBookObj.init();

		if( $( tileStoryObj.tile ).wookmarkInstance ){
			$( tileStoryObj.tile ).wookmarkInstance.clear();
		}
		
		// Tile Story Layout
		tileStoryObj.init();
	},
	init : function(){
		$( tileStoryObj.tile ).wookmark({
			align: 'left',
			autoResize: false, // Window Resize updates
			comparator: null,
			container: tileStoryObj.root,
			direction: undefined,
			ignoreInactiveItems: true,
			itemWidth: 304,
			fillEmptySpace: false,
			flexibleWidth: 0,
			// offset: 16,
			offset: 40,
			onLayoutChanged: undefined,
			outerOffset: 0,
			possibleFilters: [],
			resizeDelay: 50,
			verticalOffset: undefined
		});
	}
}

/*******************************************************************************
Storybook Flip Init - Work with tileStoryObj
*******************************************************************************/
var flipBookObj = (function() {
	var $grid = $( '.tileStory' );
	return {
		init : function() {
			$grid.find( 'div.bb-bookblock' ).not('.initialized').each( function( i ) {
				var $bookBlock = $( this ),
					$nav = $bookBlock.siblings('.dot-nav').children( 'span' ),
					bb = $bookBlock.bookblock( {
						// autoplay : true,
						// interval : 2000,
						speed : 800,
						shadowSides : 0.5,
						shadowFlip : 0.2,
						shadows : false
					} );

				// Only targeting voice element within current StoryBook // Custom add on
				var stopStoryVoiceAll = function(){
					$(".ui-btn.stage", $bookBlock).removeClass('default ready playing stop pumbing').addClass('default');
					if(console_enable == true) console.log( "stopStoryVoiceAll()" );
				}
				var control = $bookBlock.siblings('.control').children( 'button' ); // Custom add on
					
				// add navigation events
				// $nav.each( function( i ) {
				// 	$( this ).on( 'click touchstart', function( event ) {
				// 		var $dot = $( this );
				// 		$nav.removeClass( 'bb-current' );
				// 		$dot.addClass( 'bb-current' );
				// 		$bookBlock.bookblock( 'jump', i + 1 );
				// 		return false;
				// 	} );
				// } );
				
				// add swipe events
				$bookBlock.children().on( {
					'swipeleft' : function( event ) {
						$bookBlock.bookblock( 'next' );
						return false;
					},
					'swiperight' : function( event ) {
						$bookBlock.bookblock( 'prev' );
						return false;
					}

				} );

				// Prev and Next Buttom
				control.on('click',function(e){ // Custom add on
					e.preventDefault();
					if( $(this).hasClass('bb-nav-prev') ){
						$bookBlock.bookblock( 'prev' );
						audioAPI.resetAll('init');
						return false;
					}
					if( $(this).hasClass('bb-nav-next') ){
						$bookBlock.bookblock( 'next' );
						audioAPI.resetAll();
						return false;
					}
				});

				$bookBlock.addClass('initialized'); // Custom add on

			} );
		}
	};

})();


/*******************************************************************************
Screen Scroll Lock
*******************************************************************************/
var screenLockScroll = {
	enable : function(){
		$("BODY").addClass('lock-scroll');
	},
	disable : function(){
		$("BODY").removeClass('lock-scroll');
	}
}

/*******************************************************************************
Loading in Progress
*******************************************************************************/
var loadInProgress = {
	enable : function(){
		$("BODY").addClass('loading-in-progress');
	},
	disable : function(){
		$("BODY").removeClass('loading-in-progress');
	}
}

/*******************************************************************************
Initialize SVG Blur
*******************************************************************************/
var svgBlur = {
	init : function(){
		$("BODY").append('<svg class="blur" aria-hidden="true" style="display: block; position: absolute; height: 0; width: 0; z-index: -9999; outline: none; border: none; background: none;"><filter id="blur-effect-1"><feGaussianBlur in="SourceGraphic" stdDeviation="' + blurEffect_story + '" /></filter><filter id="blur-effect-2"><feGaussianBlur in="SourceGraphic" stdDeviation="' + blurEffect_bg + '" /></filter></svg>');
		$("HEAD").append('<style type="text/css" media="screen">.background-screen-item{filter:url(#blur-effect-2)}.tileStory .story.event:hover .photo>SPAN,.tileStory .story.photo:hover .photo>SPAN{filter:url(#blur-effect-1)}.tileStory .story.photo.no-text:hover .photo>SPAN{filter:none}</style>');
		console.log('SVG Blur Appended');
	}
}
svgBlur.init(); // Execute 

/*******************************************************************************
Initialize stories ui-buttons
*******************************************************************************/
var storiesBtn = {
	root : false,
	init : function(){
		this.root = $('.tileStory');
		storiesBtn.bindUI();
	},
	getValue : function(ele){ // Get value in number
		var value = $(ele).text();
		return parseInt(value); // return int only
	},
	resetUI : function(){
		$('.ui-btn', storiesBtn.root).off('click');
		$(".menu-widget .ui-btn[data-privacy]", storiesBtn.root).off('click');
	},
	bindUI : function(){

		// Reset all UI
		storiesBtn.resetUI();

		// Initialize click event to all ui-button
		$('.ui-btn.readmore', storiesBtn.root).on('click',function(e){
			var thisStory = $(this).closest('.story');
			var hasDetailsFrame = $('a.storyDetailsFrame', thisStory).length;
			if( hasDetailsFrame > 0 ){
				$(thisStory).find('a.storyDetailsFrame:eq(0)').trigger('click');
			}
			console.log( hasDetailsFrame );
			// alert( "Comment clicked " + storiesBtn.getValue( $(this)) );
			return false;
		});

		$('.ui-btn[data-share]', storiesBtn.root).on('click',function(e){
			var action = $(this).attr('data-share');
			var storyID = parseInt( $(this).closest('[data-story-id]').attr('data-story-id') );
			if( storyID == null || storyID == 'undefined' ){
				console.error('Share button');
				alert('Story Id Not found');
				return false;
			}
			shareStoryModal.toShow(storyID);
			lightboxModal.toShow();
			return false;
		});

		// Voice Contorl
		$(".ui-btn.stage", storiesBtn.root).on('click',function(e){
			var target = $(this);
			if( $(this).hasClass('default') ){
				audioAPI.playThis( target );
				//$(this).removeClass('default ready playing stop pumbing').addClass('playing pumbing');
			}else if( $(this).hasClass('playing') ){
				// $(this).removeClass('default ready playing stop pumbing').addClass('default');
				audioAPI.resetAll();
			}
			return false;
		});

		// Social UI-Buttons (Only Affecting the Story, not Storybook or Event)
		$('.ui-btn.comment', storiesBtn.root).on('click',function(e){
			var thisStory = $(this).closest('.story');
			var hasDetailsFrame = $('a.storyDetailsFrame', thisStory).length;
			if( hasDetailsFrame > 0 ){
				$(thisStory).find('a.storyDetailsFrame:eq(0)').trigger('click');
			}
			console.log( hasDetailsFrame );
			// alert( "Comment clicked " + storiesBtn.getValue( $(this)) );
			return false;
		});
		$('.ui-btn.like', storiesBtn.root).on('click',function(e){
			var btn_id = StringUtils.toNumeric( $(this).attr('data-like-btn-id') );
			var btn_number = $(this).find('.number');
			var btn_icon = $(this).find('.icon');

			// Development 
			var socialAction = $(btn_icon).hasClass('social-like') ? "like" : "unlike";
			var storyRQ = new StoryRQ(socialAction, btn_id);
			console.log(storyRQ);
			var promisedStoryRQ = storyRQ.fire();
			var fnFail = function(e){
				console.groupCollapsed("like Story failed");
				console.warn(e);
				console.groupEnd();
			};
			promisedStoryRQ.fail(fnFail)
			.done(function(results){
				if(results == null || results.status == null || results.status.code != 0000){
					fnFail(results);
				}
				else{
					console.groupCollapsed("like Story done");
					var storyRS = new StoryRS(results);
					var story = storyRS.parseSocialResult();
					console.log(story);
					console.log(story.isLikedByMe());
					console.log(story.isDislikedByMe());
					console.log(story.isSupportedByMe());
                                        
					if( story.isLikedByMe() ){
						$(btn_icon).removeClass('social-like').addClass('social-liked');
					}else{
						$(btn_icon).removeClass('social-liked').addClass('social-like');
					}

					// Change Count Number
					$(btn_number).text( story.likeCount );

					// Update Dislike Button
					var dislikeBtn = $('[data-dislike-btn-id="' + btn_id + '"]');
					if( story.isDislikedByMe() ){
						$(dislikeBtn).find('.icon').removeClass('social-dislike').addClass('social-disliked');
					}else{
						$(dislikeBtn).find('.icon').removeClass('social-disliked').addClass('social-dislike');
					}
					$(dislikeBtn).find('.number').text( story.dislikeCount );

					console.groupEnd();
				}
			});
			return false;
		});
		$('.ui-btn.dislike', storiesBtn.root).on('click',function(e){
			var btn_id = StringUtils.toNumeric( $(this).attr('data-dislike-btn-id') );
			var btn_number = $(this).find('.number');
			var btn_icon = $(this).find('.icon');

			// Development 
			var socialAction = $(btn_icon).hasClass('social-dislike') ? "dislike" : "undislike";
			var storyRQ = new StoryRQ(socialAction, btn_id);
			console.log(storyRQ);
			var promisedStoryRQ = storyRQ.fire();
			var fnFail = function(e){
				console.groupCollapsed("Dislike Story failed");
				console.warn(e);
				console.groupEnd();
			};
			promisedStoryRQ.fail(fnFail)
			.done(function(results){
				if(results == null || results.status == null || results.status.code != 0000){
					fnFail(results);
				}
				else{
					console.groupCollapsed("Dislike Story done");
					var storyRS = new StoryRS(results);
					var story = storyRS.parseSocialResult();
					console.log(story);
					console.log(story.isLikedByMe());
					console.log(story.isDislikedByMe());
					console.log(story.isSupportedByMe());

					if( story.isDislikedByMe() ){
						$(btn_icon).removeClass('social-dislike').addClass('social-disliked');
					}else{
						$(btn_icon).removeClass('social-disliked').addClass('social-dislike');
					}

					// Change Count Number
					$(btn_number).text( story.dislikeCount );

					// Update Like Button
					var likeBtn = $('[data-like-btn-id="' + btn_id + '"]');
					if( story.isLikedByMe() ){
						$(likeBtn).find('.icon').removeClass('social-like').addClass('social-liked');
					}else{
						$(likeBtn).find('.icon').removeClass('social-liked').addClass('social-like');
					}
					$(likeBtn).find('.number').text( story.likeCount );

					console.groupEnd();
				}
			});
			return false;
		});
		$('.ui-btn.support', storiesBtn.root).on('click',function(e){
			var btn_id = StringUtils.toNumeric( $(this).attr('data-support-btn-id') );
			var btn_number = $(this).find('.number');
			var btn_icon = $(this).find('.icon');

			// Development 
			var socialAction = $(btn_icon).hasClass('social-support') ? "support" : "unsupport";
			var storyRQ = new StoryRQ(socialAction, btn_id);
			console.log(storyRQ);
			var promisedStoryRQ = storyRQ.fire();
			var fnFail = function(e){
				console.groupCollapsed("Support Story failed");
				console.warn(e);
				console.groupEnd();
			};
			promisedStoryRQ.fail(fnFail)
			.done(function(results){
				if(results == null || results.status == null || results.status.code != 0000){
					fnFail(results);
				}
				else{
					console.groupCollapsed("Support Story done");
					var storyRS = new StoryRS(results);
					var story = storyRS.parseSocialResult();
					console.log(story);
					console.log(story.isLikedByMe());
					console.log(story.isDislikedByMe());
					console.log(story.isSupportedByMe());

					if( story.isSupportedByMe() ){
						$(btn_icon).removeClass('social-support').addClass('social-supported');
					}else{
						$(btn_icon).removeClass('social-supported').addClass('social-support');
					}

					// Change Count Number
					$(btn_number).text( story.supportCount );

					console.groupEnd();
				}
			});
			return false;
		});

		// Show Specific Popup Menu 
		$(".menu .ui-btn.menu, .menu .ui-btn.edit, .menu .ui-btn.privacy", storiesBtn.root).on('click',function(e){
			var thisStory = $(this).closest(".story");
			var thisMenuWidget = $(thisStory).find(".menu-widget");
			var menuType = $(this).attr('data-menu-type');

			if( $(thisMenuWidget).find('.button-container.'+menuType).hasClass('show') ){
				$(storiesBtn.root).find(".menu-widget .button-container").removeClass('show');
				$(storiesBtn.root).find('.story').removeClass('show-menu');
				return false;
			}

			$(storiesBtn.root).find(".menu-widget .button-container").removeClass('show');
			$(thisMenuWidget).find('.button-container.'+menuType).addClass('show');

			$(storiesBtn.root).find('.story').removeClass('show-menu');
			$(thisStory).addClass('show-menu');

			$(thisStory).off('mouseleave');
			$(thisStory).on('mouseleave',function(e){
				$(storiesBtn.root).find(".menu-widget .button-container").removeClass('show');
				$(storiesBtn.root).find('.story').removeClass('show-menu');
				console.log("Hide menu-widget");
				return false;
			});

			console.log("Show " + menuType + " menu-widget");
			return false;
		});

		// Set Privacy Level
		$(".menu-widget .ui-btn[data-privacy]", storiesBtn.root).on('click',function(e){
			var thisStory = $(this).closest(".story");
			var thisStory_id = StringUtils.toNumeric( $(thisStory).attr('data-story-id') );
			var thisList = $(this).closest("LI");
			var thisPrivacy = $(this).attr("data-privacy");

			// $(thisList).addClass('selected').siblings().removeClass('selected');
			// $(thisStory).find('.ui-btn.privacy').attr('data-privacy', thisPrivacy);
			console.log("Privacy set to " + $(this).attr('data-privacy').toUpperCase() );
			// return false;


			// Connected to Backend Call
			var story = new Story({
				id: thisStory_id,
				displayLevel: translateLevel( thisPrivacy )
			});
			var promisedPost = story.post('modify');
			promisedPost.done(function(result){
				console.warn(result);
				$(thisList).addClass('selected').siblings().removeClass('selected');
				$(thisStory).attr('data-privacy', thisPrivacy);
				$(thisStory).find('.ui-btn.privacy').attr('data-privacy', thisPrivacy);
			});
			return false;
		});

		// Pin to storybook
		$(".menu-widget .ui-btn.add-to-story", storiesBtn.root).on('click',function(e){
			var storyID = parseInt( $(this).closest('[data-story-id]').attr('data-story-id') );
			if( storyID == null || storyID == 'undefined' ){
				console.error('Share button');
				alert('Story Id Not found');
				return false;
			}
			$.when( storybookListModal.toShow().promise() ).done(function( pBook ){
				console.log( pBook );

				if( pBook !== null && typeof pBook !== 'undefined'){

					$.ajax({
						url : serverPath + "/rest/story/modify",
						data : JSON.stringify({
							story: {
								id: storyID,
								groupId: pBook.id
							}
						}),
						type : "POST",
						contentType : "application/json; charset=UTF-8",
						dataType : "json",
						xhrFields: {
							withCredentials: true
						},
						success: function(data){
							if(data.status.code == "0000"){
								$('.story[data-story-id="'+storyID+'"]', storiesBtn.root).remove();
								tileStoryObj.update();
								sidebarCalendar.update();
							}
						}
					});

				}

			});
			return false;
		});

		// Edit Story or Storybook
		$(".menu-widget .ui-btn.edit-story", storiesBtn.root).on('click',function(e){
			var storyID = $(this).attr('data-story-btn-id');
			var storyType = $(this).attr('data-story-type');

			if( storyType == 'story' ){
				$(this).prev('a.storyEditFrame').trigger('click');
			}
			return false;
		});

		// Delete Story or storybook
		$(".menu-widget .ui-btn.delete-story", storiesBtn.root).on('click',function(e){
			var storyID = $(this).attr('data-delete-btn-id');
			var storyType = $(this).attr('data-story-type');

			if( storyType == 'story' ){
				SDS.call('storyDelete', {id: storyID}, function(res){
					if(res.status.code == "0000"){
						$('.story[data-story-id="'+storyID+'"]', storiesBtn.root).remove();
						tileStoryObj.update();
						sidebarCalendar.update();
					}
				});
			}
			return false;
		});

		// Report Story or Storybook
		$(".menu-widget .ui-btn.report", storiesBtn.root).on('click',function(e){
			var storyType = $(this).attr('data-story-type');
			alert('Report ' + storyType);
			return false;
		});


		// Event Joining
		$('.ui-btn.join-event', storiesBtn.root).on('click',function(e){
			var target = $(this);
			// var eventType = $(this).closest('.story.event').attr('data-event');
			var id = $(this).closest('.story.event').attr('data-event-id');

			if( target.hasClass('joined') ){
				new EventRQ("quit", {id: id}).fire().done(function(results){
					var eventRS = new EventRS(results);
					if(eventRS.IS_FAIL){
						console.warn(eventRS);
					}
					else{
						target.removeClass('joined');
						console.log("Not Joining");
					}
				});
			}else{
				new EventRQ("join", {id: id}).fire().done(function(results){
					var eventRS = new EventRS(results);
					if(eventRS.IS_FAIL){
						console.warn(eventRS);
					}
					else{
						target.addClass('joined');
						console.log("Joined");
					}
				});
			}
			return false;
		});

		// Show Event Storybook
		$('.ui-btn.event-storybook', storiesBtn.root).on('click',function(e){
			var target = $(this);
			alert("Show Event Storybook");
			return false;
		});

		console.log( 'Stories Button Initialized' );

	}

}


/*******************************************************************************
Overlay Modal Function
*******************************************************************************/
var lightboxModal = {
	root : false,
	init : function(){
		this.root = $('#lightbox-modal');
		console.log( "lightboxModal Initialized" );
	},
	toShow : function(){
		$( lightboxModal.root ).addClass('show');
		screenLockScroll.enable();
	},
	toHide : function(){
		$( lightboxModal.root ).removeClass('show');
		screenLockScroll.disable();
	}
}

/*******************************************************************************
Share Story Modal Function
*******************************************************************************/
var shareStoryModal = {
	debug : false,
	getID : null,
	root : false,
	init : function(){
		this.root = $('#share-story-modal');
		shareStoryModal.generate();
		shareStoryModal.toHide();
		shareStoryModal.bindFunctions();
		shareStoryModal.resetValues();
		console.log( "shareStoryModal Initialized" );
	},
	getContent : function(StoryID){
		$('.textField', shareStoryModal.root).val('About to share Story('+ StoryID + ')');
	},
	delayTimer : 500,
	toShow : function(storyId){
		$( shareStoryModal.root ).addClass('show');
                shareStoryModal.getID = storyId;
		if( shareStoryModal.debug) console.log( "shareStoryModal Show" );
	},
	toHide : function(){
                $(".wrapper.tileStory").css("opacity","1")
		$( shareStoryModal.root ).removeClass('show').removeAttr('class');
		setTimeout(function(){
			shareStoryModal.resetValues();
		}, shareStoryModal.delayTimer );
		if( shareStoryModal.debug) console.log( "shareStoryModal Hide" );
	},
	resetValues : function(){
		$('TEXTAREA, INPUT:hidden', shareStoryModal.root).val('');
                shareStoryModal.getID = null;
		if( shareStoryModal.debug) console.log( "shareStoryModal Reset Values" );
	},
	generate : function(){
		var wrapper = $("<div class='content-wrapper' />").appendTo( shareStoryModal.root );
		var container = $("<div class='container story-share' />").appendTo( wrapper );
		var header = $("<div class='header' />").appendTo( container );
		var content = $("<div class='content' />").appendTo( container );
		var menu = $("<div class='menu' />").appendTo( container );
		var buttonContainer = $("<div class='button-container' />").appendTo( menu );
		$(header).append('<p class="subject">Share story on my timeline</p>');
		$(header).append('<button class="ui-btn cancel">Cancel</button>');
		$(content).append('<textarea class="textField photo" name="content" placeholder="Comment on this ... (optional)"></textarea>');
		$(content).append('<input type="hidden" name="storyID">');
		$(buttonContainer).append('<button class="ui-btn skip">Skip</button>');
		$(buttonContainer).append('<button class="ui-btn share">Share</button>');
		if( shareStoryModal.debug) console.log('shareStoryModal Element Generated');
	},
	bindFunctions : function(){

		// Hide Lightbos and Share Story Modal
		$( shareStoryModal.root ).on('click',function(e){
			if( !$(this).find('.container').hasClass('active') ){
				shareStoryModal.toHide();
				lightboxModal.toHide();
			}
			return false;
		});

		// Add class to post element
		$('.container', shareStoryModal.root).on('mouseenter',function(e){
			$(this).addClass('active');
			return false;
		}).on('mouseleave',function(){
			$(this).removeClass('active');
			return false;
		});

		// Cancel
		$('.ui-btn.cancel', shareStoryModal.root).on('click',function(e){
			shareStoryModal.toHide();
			lightboxModal.toHide();
			return false;
		});

		// Share Story Button
		$('.ui-btn.share', shareStoryModal.root).on('click',function(e){
			e.preventDefault();
			var content = $('.textField', shareStoryModal.root).val();
			if( content == '' || content == null ){
				content = 'Currently empty';
				alert(content);
			}else{
				path ="/rest/story/share";
				sendData = {};
				sendData.story = {
					"referenceID" : shareStoryModal.getID,
					"content" : $("textarea[name='content']",shareStoryModal.root).val()
				};

				$.ajax({
					type: "POST",
					contentType: "application/json; charset=UTF-8",
					url: serverPath + path,
					data: JSON.stringify(sendData),
					dataType: "json",
					xhrFields: {
					withCredentials: true
					},
					success: function(data){
						console.log(data)
						shareStoryModal.toHide();
						lightboxModal.toHide();
					},
					error: function(data) {
						alert("Error");
					}
				}); 
			}                        
			// return false;
		});

		// Remove White Space
		$('.textField', shareStoryModal.root).on('blur',function(e){
			$(this).val( trim_whiteSpace( $(this).val() ) );
		});

		if( shareStoryModal.debug) console.log( "shareStoryModal Bind Function" );

	}

}


/*******************************************************************************
Share Event Modal Function
*******************************************************************************/
var shareEventModal = {
	debug : false,
	getID : null,
	root : false,
	init : function(){
		this.root = $('#share-event-modal');
		shareEventModal.generate();
		shareEventModal.toHide();
		shareEventModal.bindFunctions();
		shareEventModal.resetValues();
		console.log( "shareEventModal Initialized" );
	},
	getContent : function(EventID){
		$('.textField', shareEventModal.root).val('About to share Event('+ EventID + ')');
	},
	delayTimer : 500,
	toShow : function(eventId){
		$( shareEventModal.root ).addClass('show');
                shareEventModal.getID = eventId;
		if( shareEventModal.debug) console.log( "shareEventModal Show" );
	},
	toHide : function(){
                $(".wrapper.tileEvent").css("opacity","1")
		$( shareEventModal.root ).removeClass('show').removeAttr('class');
		setTimeout(function(){
			shareEventModal.resetValues();
		}, shareEventModal.delayTimer );
		if( shareEventModal.debug) console.log( "shareEventModal Hide" );
	},
	resetValues : function(){
		$('TEXTAREA, INPUT:hidden', shareEventModal.root).val('');
                shareEventModal.getID = null;
		if( shareEventModal.debug) console.log( "shareEventModal Reset Values" );
	},
	generate : function(){
		var wrapper = $("<div class='content-wrapper' />").appendTo( shareEventModal.root );
		var container = $("<div class='container event-share' />").appendTo( wrapper );
		var header = $("<div class='header' />").appendTo( container );
		var content = $("<div class='content' />").appendTo( container );
		var menu = $("<div class='menu' />").appendTo( container );
		var buttonContainer = $("<div class='button-container' />").appendTo( menu );
		$(header).append('<p class="subject">Share event on my timeline</p>');
		$(header).append('<button class="ui-btn cancel">Cancel</button>');
		$(content).append('<textarea class="textField photo" name="content" placeholder="Comment on this ... (optional)"></textarea>');
		$(content).append('<input type="hidden" name="eventID">');
		$(buttonContainer).append('<button class="ui-btn skip">Skip</button>');
		$(buttonContainer).append('<button class="ui-btn share">Share</button>');
		if( shareEventModal.debug) console.log('shareEventModal Element Generated');
	},
	bindFunctions : function(){

		// Hide Lightbos and Share Event Modal
		$( shareEventModal.root ).on('click',function(e){
			if( !$(this).find('.container').hasClass('active') ){
				shareEventModal.toHide();
		//		lightboxModal.toHide();
			}
			return false;
		});

		// Add class to post element
		$('.container', shareEventModal.root).on('mouseenter',function(e){
			$(this).addClass('active');
			return false;
		}).on('mouseleave',function(){
			$(this).removeClass('active');
			return false;
		});

		// Cancel
		$('.ui-btn.cancel', shareEventModal.root).on('click',function(e){
			shareEventModal.toHide();
	//		lightboxModal.toHide();
			return false;
		});

		// Share Event Button
		$('.ui-btn.share', shareEventModal.root).on('click',function(e){
			e.preventDefault();
			var content = $('.textField', shareEventModal.root).val();
			if( content == '' || content == null ){
				content = 'Currently empty';
				alert(content);
			}else{
				path ="/rest/event/share";
				sendData = {};
				sendData.event = {
					"referenceID" : shareEventModal.getID,
					"content" : $("textarea[name='content']",shareEventModal.root).val()
				};

				$.ajax({
					type: "POST",
					contentType: "application/json; charset=UTF-8",
					url: serverPath + path,
					data: JSON.stringify(sendData),
					dataType: "json",
					xhrFields: {
					withCredentials: true
					},
					success: function(data){
						console.log(data)
						shareEventModal.toHide();
//						lightboxModal.toHide();
					},
					error: function(data) {
						alert("Error");
					}
				}); 
			}                        
			// return false;
		});

		// Remove White Space
		$('.textField', shareEventModal.root).on('blur',function(e){
			$(this).val( trim_whiteSpace( $(this).val() ) );
		});

		if( shareEventModal.debug) console.log( "shareEventModal Bind Function" );

	}

}

/*******************************************************************************
Spinner Modal
*******************************************************************************/
var spinnerModal = {
	debug : false,
	delayTimer : 500,
	root : false,
	init : function(){
		this.root = $('#spinner-modal');
		var box = $('<div />').addClass('content-wrapper').html('<div class="icon s48 green spinner"></div>');
		$(box).appendTo( spinnerModal.root );
		spinnerModal.toHide();
		console.log( "spinnerModal Initialized" );
	},
	toShow : function(){
		$('.spinner', spinnerModal.root).sprite({fps: 16, no_of_frames: 8, start_at_frame: 0});
		setTimeout(function(){
			$( spinnerModal.root ).addClass('show');
		}, spinnerModal.delayTimer / 5 );
	},
	toHide : function(){
		$( spinnerModal.root ).removeClass('show');
		setTimeout(function(){
			$('.spinner', spinnerModal.root).destroy();
		}, spinnerModal.delayTimer / 5 );
	}
}

var editStoryModal = {
	content: null,
	zoom: 17,
	currentView : null,
	delayTimer : 500,
	isJoinable : false,
	location_lat : 22.284641,
	location_long : 114.158107,
	location_lat_temp : null, 
	location_long_temp : null, 
	myLocation : null,
	myLocation_temp : null,
	myLocationHotspot : null, 
	myLocationStored : false,
	myLocationIcon : 'images/theme/all_icons/1x/newStoryEvent-map-marker-32px.png',
	toShow : function(eventId){
		console.log(editStoryModal.location_long);
		editStoryModal.currentLocation();

		editStoryModal.eventMap_fixed();
		editStoryModal.eventMap_view();

		$( editStoryModal.root ).addClass('show');
		$(".event-show-box", editStoryModal.root).show(); 
		$('.event-box', editStoryModal.root).hide();
		$('button.ui-btn.update-event', editStoryModal.root).hide();
		$('.event-show-box div.details').addClass('show');
		$('.event-show-box div.location').removeClass('show');
		$('.event-show-box .grid.details-select span', editStoryModal.root).css('color','#000');
		$('.event-show-box .grid.details-select span.show-details', editStoryModal.root).css('color','#10A08E');
		$('.right-tabs',editStoryModal.root).find('span').removeClass('show');
		$('.right-tabs .tab1',editStoryModal.root).find('span').addClass('show');
		
		eventComment.init();
	},
	toHide : function(){
		$( editStoryModal.root ).removeClass('show');
		setTimeout(function(){
			editStoryModal.switchView('general');
			$(".right_msg_box",editStoryModal.root).hide();
			$(".event-story-box",editStoryModal.root).hide();
			$(".participants-box",editStoryModal.root).hide();
			$(".event-show-box", editStoryModal.root).hide(); 
			$('.event-box', editStoryModal.root).hide();				
			$('button.ui-btn.update-event', editStoryModal.root).hide();
			editStoryModal.resetValues();
		}, editStoryModal.delayTimer );
	},
	isEmpty : function() {
		
	},
	switchView : function(view){
		
	},
	resetValues : function(){
		$('INPUT, TEXTAREA', editStoryModal.root).val('');
		$('.storybook-list .container', editStoryModal.root).removeClass('active');
		$('.storybook-list .container', editStoryModal.root).removeClass('active');
		$('[data-view-type="storybook"] .display-content', editStoryModal.root).html('');
		$('[data-view-type="photo"] .input-col.photo', editStoryModal.root).html('');
		$('.ui-btn.add-to-storybook .text', editStoryModal.root).text('Select storybook');
		$('.ui-btn.privacy', editStoryModal.root).attr('data-privacy','public').find('.text').text('Public');
		$('.ui-btn.privacy', editStoryModal.root).find('.icon:not(.ui-triangle-down)').removeClass('public friends closeFriends myself inviteOnly').addClass('public');
		$('.privacy-list', editStoryModal.root).attr('data-privacy','public').find('.ui-btn').removeClass('current');
		$('.privacy-list .ui-btn[data-privacy="public"]:not(.privacy)', editStoryModal.root).addClass('current');
		editStoryModal.isEmpty();
		editStoryModal.switchView('general');
		
		$('INPUT:CHECKBOX', editStoryModal.root).removeAttr('checked');
		$('.list-item', editStoryModal.root).removeClass('checked taken');
		$('.ui-btn.checkbox', editStoryModal.root).removeClass('checked taken');
		$('.event-edit-post .grid.location .map', editStoryModal.root).removeClass('show');
		$('.event-edit-post .block-list.checkable-list', editStoryModal.root).html('');
		$('.event-edit-post .block-list.selected-list .ui-btn.remove', editStoryModal.root).trigger('click');
		editStoryModal.participantsListView('view-selected');
		$('.timepickerField', editStoryModal.root).removeClass('hide');
		$('.friend-list', editStoryModal.root).addClass('enabled');
		$('.event-edit-post .joinable-event INPUT:checkbox', editStoryModal.root).prop('checked',true);
		editStoryModal.isJoinable = false;
		editStoryModal.location_lat_temp = null;
		editStoryModal.location_long_temp = null; 
		editStoryModal.zoom = 17;

		if(console_enable == true) console.log( "editStoryModal Reset Values" );
		
	},
	root : false,
    init : function(){
        this.root = $('#edit-story-modal');
    		editStoryModal.toHide();
		lightboxModal.toHide();
		editStoryModal.bindFunctions();
		editStoryModal.resetValues();

		$(".right_msg_box",editStoryModal.root).hide();
		$(".event-story-box",editStoryModal.root).hide();
		$(".participants-box",editStoryModal.root).hide();

		// Datepicker
		$(".ui-btn.datepickerInput", editStoryModal.root).datepicker({ 
			numberOfMonths: 2,
			dateFormat: 'dd M yy',
			maxDate: 0
		});
		$(".event-new-post .ui-btn.datepickerInput", editStoryModal.root).datepicker( 'destroy' ).datepicker({ 
			numberOfMonths: 1,
			dateFormat: 'dd M yy',
			minDate : 0
		});

		// Timepicker Init
		$('.ui-btn.timepickerInput', editStoryModal.root).timepicker({
			closeOnWindowScroll : true,
			'timeFormat': 'g:i a', 
			step : 15
		}).on('keyup keydown', function(e){
			e.preventDefault();
		});

		GoogleSearchBox.bind(this, 'event_location');
		console.log( "editStoryModal Initialized" );
	},		
	joinableTacker : function(){
		if( editStoryModal.isJoinable ){
			$('.friend-list', editStoryModal.root).addClass('enabled');
		}else{
			$('.friend-list', editStoryModal.root).removeClass('enabled');
		}
	},		
	currentLocation : function(){
if (typeof google == 'undefined') return;		
		var location = new google.maps.LatLng( editStoryModal.location_lat, editStoryModal.location_long );
		editStoryModal.myLocation = location;
	},
	updateLocation : function(){
		if( editStoryModal.myLocation_temp == null ){
			editStoryModal.myLocation_temp = editStoryModal.myLocation;
		}
		editStoryModal.location_lat = editStoryModal.location_lat_temp;
		editStoryModal.location_long = editStoryModal.location_long_temp;
		editStoryModal.myLocation = editStoryModal.myLocation_temp;
	},
	eventMap_view : function(){
if (typeof google == 'undefined') return;		
		editStoryModal.currentLocation();	
		var mapOptions = {
			center : editStoryModal.myLocation,
			zoom : editStoryModal.zoom, 
			mapTypeId : google.maps.MapTypeId.ROADMAP,
	  		disableDefaultUI: true,
			draggable : false,
			panControl : false,
			mapTypeControl : false,
			mapTypeControlOptions : {
				style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			},
			zoomControl : false,
			zoomControlOptions : {
				style: google.maps.ZoomControlStyle.SMALL
			}
		};
		$("#event-map-view",editStoryModal.root ).html('');
		var map = new google.maps.Map($("#event-map-view",editStoryModal.root )[0], mapOptions);

		var marker = new google.maps.Marker({
			// position : new google.maps.LatLng( 22.284641, 114.158107 )
			position : editStoryModal.myLocation,
			map : map,
			// draggable : true,
			draggable : false,
			clickable : false, 
			animation : google.maps.Animation.DROP,
			icon: editStoryModal.myLocationIcon
		});

		console.log('Final location is : ' + editStoryModal.myLocation );

		google.maps.event.addListener(map, 'zoom_changed', function() {
			map.panTo(marker.getPosition());
		});

		google.maps.event.trigger(map, "resize");
	},		
	eventMap_fixed : function(){
if (typeof google == 'undefined') return;		
		var mapOptions = {
			center : editStoryModal.myLocation,
			zoom : editStoryModal.zoom, 
			mapTypeId : google.maps.MapTypeId.ROADMAP,
	  		disableDefaultUI: true,
			draggable : false,
			panControl : false,
			mapTypeControl : false,
			mapTypeControlOptions : {
				style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			},
			zoomControl : false,
			zoomControlOptions : {
				style: google.maps.ZoomControlStyle.SMALL
			}
		};

		var map = new google.maps.Map($("#event-map-fixed",editStoryModal.root )[0], mapOptions);

		var marker = new google.maps.Marker({
			position : editStoryModal.myLocation,
			map : map,
			draggable : false,
			clickable : false, 
			animation : google.maps.Animation.DROP,
			icon: editStoryModal.myLocationIcon
		});

		console.warn(editStoryModal.myLocation );

		google.maps.event.addListener(map, 'zoom_changed', function() {
			map.panTo(marker.getPosition());
		});

		google.maps.event.trigger(map, "resize");
	},
	eventMap_draggable : function(arg){
if (typeof google == 'undefined') return;		

		var displayLocation = editStoryModal.myLocation;
		if(arg == 'bySearch'){
			displayLocation = editStoryModal.myLocation_temp;
		}

		var mapOptions = {
			// center : new google.maps.LatLng( 22.284641, 114.158107 ),
			center : displayLocation,
			zoom : editStoryModal.zoom, 
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			draggable : true,
			panControl : true,
			streetViewControl: false, 
			mapTypeControl : false,
			mapTypeControlOptions : {
				style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			},
			zoomControl : true,
			zoomControlOptions : {
				style: google.maps.ZoomControlStyle.SMALL
			}
		};

		var map = new google.maps.Map($("#event-map-draggable",editStoryModal.root )[0], mapOptions);
		
		google.maps.event.addListener(map, 'zoom_changed', function() {
			editStoryModal.zoom = map.getZoom();
			map.panTo(marker.getPosition());
		});

		var marker = new google.maps.Marker({
			// position : new google.maps.LatLng( 22.284641, 114.158107 ),
			position : displayLocation,
			map : map,
			// draggable : true,
			draggable : true,
			animation : google.maps.Animation.DROP,
			icon: editStoryModal.myLocationIcon
		});

		console.log('Current location is : '+ editStoryModal.myLocation );

		// Update Marker Location 
		google.maps.event.addListener(marker, 'dragend', function(event) {
			// location_lat = event.latLng.lat();
			// location_long = event.latLng.lng();
			// myLocation = new google.maps.LatLng( location_lat, location_long );

			editStoryModal.location_lat_temp = event.latLng.lat();
			editStoryModal.location_long_temp = event.latLng.lng();
			editStoryModal.myLocation_temp = new google.maps.LatLng( editStoryModal.location_lat_temp, editStoryModal.location_long_temp );

			map.panTo(marker.getPosition());
			// console.log('final position is '+ event.latLng.lat() + ' / ' + event.latLng.lng() );
			console.log('Temp location is : '+ editStoryModal.myLocation_temp );
		});

		google.maps.event.trigger(map, "resize");
		$("#event-map-draggable",editStoryModal.root ).addClass('show');

		// Render
		// setTimeout(function() {
			// google.maps.event.trigger(map, "resize");
			// $("#event-map-draggable").addClass('show');
			// google.maps.event.addListener(marker, 'click');

			// console.log('final position is '+ myLocation );
		// },200);
	},
	participantsListView : function(view){
		$('.friend-list', editStoryModal.root).removeClass('show');
		$('.friend-list.' + view , editStoryModal.root).addClass('show');
		$('.friend-list .content-scroller', editStoryModal.root).scrollTop(0);
		if(console_enable == true) console.log( "Event Friend-List show : " +  view );
	},
	participantsChecked : function(){
		var checkableList = $('.event-edit-post .block-list.checkable-list', editStoryModal.root);
		var count = $(checkableList).find(':not(.taken) INPUT:checkbox:checked').length;
		// var count = $(checkableList).find('INPUT:checkbox:checked').length;
		if(count > 0){
			$('.event-edit-post .control', editStoryModal.root).addClass('enabled selecting');
			$('.event-edit-post .control .note .number', editStoryModal.root).text( count );
		}else{
			// $('.event-edit-post .control.enabled .note', editStoryModal.root).text('Select friends...');
			$('.event-edit-post .control', editStoryModal.root).removeClass('enabled selecting');
		}
		if(console_enable == true) console.log( "Event Friend Selected : " +  count );
	},
	participantsSaved : function(){
		var targetList = $('.event-edit-post .block-list.selected-list', editStoryModal.root);
		var count =  $(targetList).find('.list-item:not(.empty)').length;
		if( count > 0 ){
			$(targetList).addClass('empty');
		}else{
			$(targetList).removeClass('empty');
		}
		if(console_enable == true) console.log( "Event Friend Saved : " +  count );
	},
	loadFriendsInEvent : function() {
		var promisedFrdRQ = //friendRQ.fire();
			new EventRQ("friendsInEvent", {
				id: id,
				status: ["JOIN","INVITED"]
			}).fire();
		var fnFail = function(e){
		console.groupCollapsed("friends failed");
		console.warn(e);
		console.groupEnd();
		};
		promisedFrdRQ.fail(fnFail).done(function(results){
		if(results == null || results.status == null || results.status.code != 0000){
			fnFail(results);
		}
		else{
			console.log("friends done");
			console.log(results);
			var friendRS = new FriendRS(results);
			console.log(friendRS);
			if(friendRS.IS_FAIL){
				friendRS.onhold(friendRQ);
			}
			else{
				// console.log(friendRS.parseFriendList());
				var friends = friendRS.parseFriendList();
			console.log(friends);	
				$(".event-edit-post .checkable-list", editStoryModal.root).html('');
				$(friends).each(function(i,e){
					// console.log( e );
					if (results.messages[i].info.content.inEventStatus == "JOIN") return true;
					if (results.messages[i].info.content.inEventStatus == "INVITED") return true;
					
					var listItem = $("<li />").attr({'data-user-id':e.id,'class':'list-item'});
					var checkbox = $("<input />").attr({'type':'checkbox','class':'checkbox'});
					var uiCheckbox = $("<span />").addClass('ui-btn checkbox').append('<span></span>').prepend( checkbox ).appendTo( listItem );
					var name = $("<span />").addClass('name').append( e.getFullName() ).appendTo( listItem );
					var icon = $("<span />").addClass('icon s20 green').addClass( translatePrivacy(e.showLevel) ).appendTo( listItem );
		
					$(uiCheckbox).on('click',function(e){
						if( !$(this).hasClass('taken') ){
							var checkboxInput = $(this).find('INPUT:checkbox');
							if( $(checkboxInput).is(":checked") ){
								$(this).removeClass('checked').closest('.list-item').removeClass('checked');
								$(checkboxInput).removeAttr('checked');
							}else{
								$(this).addClass('checked').closest('.list-item').addClass('checked');
								$(checkboxInput).prop('checked',true);
							}
						}
						editStoryModal.participantsChecked();
						return false;
					});
					
					$(listItem).on('click',function(e){
						$(this).find('.ui-btn.checkbox').trigger('click');
					});
		
					$(".event-edit-post .checkable-list", editStoryModal.root).append( listItem );
				});
			}
		}			
		});		
	},
	loadInvitedList : function() {
		var targetList = $('.event-edit-post .block-list.selected-list', editStoryModal.root);
		$(targetList).find('.list-item:not(.empty)').remove();

		$(editStoryModal.participants).each(function(i,p) {
			console.log(p);
			var listItem = $("<li />").attr({'data-user-id':p.id,'class':'list-item'});
			var name = $("<span />").addClass('name').append( p.profile.lastName ).appendTo( listItem );
			var icon = $("<span />").addClass('right green').append( p.status ).appendTo( listItem );

			var removeBtn = $("<button />").addClass('ui-btn remove').append('<span class="icon s12 green ui-close"></span>').appendTo( listItem );
			$(removeBtn).on('click',function(e){
				$(this).closest('.list-item').remove();
				editStoryModal.participantsSaved();
				return false;
			});
			$(targetList).append( listItem );
		});

		$(targetList).find('.list-item.empty').appendTo( targetList );

		editStoryModal.participantsSaved();
		editStoryModal.participantsListView('view-selected');			
	},
	loadEventStoryList : function() {
		new EventStoryRQ("listImage", {id: editStoryModal.content.id} ).fire().done(function(results){
		/*	var eventRS = new EventRS(results);
			if(eventRS.IS_FAIL){
				console.warn(eventRS);
			}
			else{
				target.removeClass('joined');
				console.log("Not Joining");
				$('.event-join', editStoryModal.root).html("CAN'T GO");							
			}
			*/ console.log(results.messages);
			$('.event-story-list').html('')
			if (results.messages.length > 0) {
				$('.icon.s24.grid-eventstory', editStoryModal.root).html(results.messages.length );
				$('.event-story-list').html('');
				$.each(results.messages, function(i,msg) {
					story = msg.info.content.detail; 
					tn_url = story.url; 
					tn = $('<div>').addClass('thumbnail');
					var ah = $('<a>').addClass('photo')/*.addClass('cboxElement')*/.addClass("storyDetailsFrame");
					//ah.html('dummy');
					ah.attr('href','story_detail_dialog.html?data=' + $.base64.encode('id='+story.id+"&&type=event"));
					tn.css('background-image', 'url('+tn_url+')');
					tn.attr("data-id", story.id);
					console.log(tn);
					//$('.event-story-list').append(tn);
					ah.append(tn);
					$('.event-story-list').append(ah);
 				});	
 				// bind color box for the dynamically created dom element.
 				$(".event-story-list .storyDetailsFrame").colorbox({
 					transition :'fade',
 					fastIframe : false,
 					iframe : true, 
 					closeButton : false,
 					fixed : true, 
 					width : "100%", 
 					height : "100%",
 					scrolling:false,
 					onOpen:function() { 
 						$("body").css("overflow", "hidden"); 
 						$('#colorbox').css({'top':0, 'position':'fixed'});
 						$('.body').css("margin-top","16px"); // just used for story dialog 
 						$("#cboxLoadedContent").css("height",$(window).height()); 
 						$("#cboxOverlay:first").css({'background':'',"opacity":'0.9'});
 						$("#cboxOverlay").addClass("first_box");						
         				},
 					onComplete: function() {
 					    $("#cboxLoadedContent .cboxIframe").css('background', 'none transparent');
 					    $("#cboxContent").css('background', 'none transparent');
 					    $("#cboxLoadedContent").css('background', 'none transparent');
 					},
 					onCleanup:function(){$("body").css("overflow", "");}					
				});					
			}
		});
		
	},			
	bindFunctions : function(){
		$('.tileStory').on('click','p.title-of-event,td.des-of-event',function(e){ // bind to not-yet-exist element
			var target = $(this);
			var id = $(this).closest('.story.event').attr('data-event-id');
			var content = null;
			var ee = new EventRQ("extendedEvent", {
				id: id
			}).fire().done(function(results){
				console.log(results.content);
				var ivEvent = new Event(results.content);
				editStoryModal.content = ivEvent;
				content = ivEvent;
	/*			new EventRQ("friendsInEvent", {
					id: id,
  					status: ["JOIN", "INVITED"]
				}).fire().done(function(results){
					console.log(results);
				});
	*/			
				new EventRQ("participants", {
					id: id,
  					status: ["JOIN"]
				}).fire().done(function(results){
					if (results.status.code == "0000"){
						console.log('loaded participants:');
						editStoryModal.participants = results.content.participants;
						editStoryModal.loadInvitedList();
						$('.icon.s24.grid-eventpart').html(editStoryModal.content.joinCount);
						$('.icon.s24.grid-eventcomment').html(editStoryModal.content.commentCount);
					} else {
						console.log('cannot load participants.');
						console.log(results);
					}
				});

				var storyCount = editStoryModal.loadEventStoryList();
//				$('.icon.s24.grid-eventstory').html(storyCount);
				
				$(".right_msg_box",editStoryModal.root).hide();
				$(".event-story-box",editStoryModal.root).hide();
				$(".participants-box",editStoryModal.root).show();
				
				$('INPUT, TEXTAREA', editStoryModal.root).val('');
				$('[data-view-type="photo"] .input-col.photo', editStoryModal.root).html('');
				
				$('.ui-btn.privacy', editStoryModal.root).attr('data-privacy','public').find('.text').text('Public');
				$('.ui-btn.privacy', editStoryModal.root).find('.icon:not(.ui-triangle-down)').removeClass('public friends closeFriends myself inviteOnly').addClass('friends');
				$('.privacy-list').attr('data-privacy','public').find('.ui-btn', editStoryModal.root).removeClass('current');
				$('.privacy-list .ui-btn[data-privacy="public"]:not(.privacy)', editStoryModal.root).addClass('current');

				$('INPUT:CHECKBOX', editStoryModal.root).removeAttr('checked');
				$('.list-item', editStoryModal.root).removeClass('checked taken');
				$('.ui-btn.checkbox', editStoryModal.root).removeClass('checked taken');
				$('.event-edit-post .grid.location .map', editStoryModal.root).removeClass('show');
				$('.event-edit-post .block-list.checkable-list', editStoryModal.root).html('');
				$('.event-edit-post .block-list.selected-list .ui-btn.remove', editStoryModal.root).trigger('click');
				//TODO
				//editStoryModal.participantsListView('view-selected');
				$('.timepickerField', editStoryModal.root).removeClass('hide');
				$('.friend-list', editStoryModal.root).addClass('enabled');
				$('.event-edit-post .joinable-event INPUT:checkbox', editStoryModal.root).prop('checked',true);
				editStoryModal.isJoinable = false;
				editStoryModal.location_lat_temp = null;
				editStoryModal.location_long_temp = null; 
				editStoryModal.zoom = 17;

				if (editStoryModal.content.images.length > 0) {
					$('.event-edit-post .event-show-box .grid.photo').css('background-image',"url('"+editStoryModal.content.images[0].url+"')");
					$(".grid.photo .button-container",editStoryModal.root).hide();
				} else {
					$('.event-edit-post .event-show-box .grid.photo').css('background-image',"");
					$(".grid.photo .button-container",editStoryModal.root).show();
				}
					
				var pEvent = content;
				var admin = new Profile(pEvent.profile);
				var notification = '';
				if( admin.id != profileAPI.getProfile().id && CollectionUtils.isNotEmpty(pEvent.invitors) ){
					notification = "Invited by : " + new Profile(pEvent.invitors[0]).getFullName();
				}
				else{
					notification = "Organized by : " + admin.getFullName();
				}
				$(".subject-container .subject", editStoryModal.root).html(content.name);
				$(".subject-container .notification", editStoryModal.root).html(notification);
				$('.event-edit-post .event-show-box div.details', editStoryModal.root).html(content.description);
				var eventBegin = dateAPI.from(pEvent.begin);
				var eventEnd = dateAPI.from(pEvent.end);
				$('.event-edit-post .event-show-box div.name', editStoryModal.root).html(eventBegin.into('d MMM'));
				$('.event-edit-post .event-show-box div.date', editStoryModal.root).html(eventBegin.into('h:mm n') + ' - ' + eventEnd.into('h:mm n')+ '<br/><span class="location_span">' +(content.location == null ? '' : content.location )+'</span>' );
				
				$('.event-edit-post input[name=event_name]', editStoryModal.root).val(content.name);
				$('.event-edit-post textarea[name=event_details]', editStoryModal.root).val(content.description);
				$('.event-edit-post input[name=start_date]', editStoryModal.root).val( dateAPI.from(content.begin).into('d MMM yyyy'));
				$('.event-edit-post input[name=start_time]', editStoryModal.root).val(dateAPI.from(content.begin).into('h:mm n'));
				$('.event-edit-post input[name=end_date]', editStoryModal.root).val(dateAPI.from(content.end).into('d MMM yyyy'));
				$('.event-edit-post input[name=end_time]', editStoryModal.root).val(dateAPI.from(content.end).into('h:mm n'));
				$('.event-edit-post [name="event_location"]', editStoryModal.root).val(content.location);
				$('.event-edit-post .all-day-event INPUT:checkbox', editStoryModal.root).prop('checked', true);
				editStoryModal.myLocationHotspot = content.hotspot == null ? {} : content.hotspot;
				editStoryModal.location_lat = content.hotspot == null ? editStoryModal.location_lat : content.hotspot.latitude;
				editStoryModal.location_long = content.hotspot == null ? editStoryModal.location_long : content.hotspot.longitude;
				console.log(editStoryModal);
				$('.event-join', editStoryModal.root).html(content.hasJoint ? "GOING" : "CAN'T GO");			 //TODO: not decided?							
				
				$(editStoryModal.root).attr('data-post-type', 'event');
				eventUploaderForEdit();
				eventStoryUploader();

				if (profileAPI.getProfile().id == editStoryModal.content.profile.id) {
					$('.subject-container .ui-btn.edit', editStoryModal.root).show();					
					$('.subject-container .ui-btn.share', editStoryModal.root).hide();					
				} else {
					$('.subject-container .ui-btn.edit', editStoryModal.root).hide();					
					$('.subject-container .ui-btn.share', editStoryModal.root).show();					
				}
				
				$("#event-map-fixed",editStoryModal.root ).addClass('show');

				lightboxModal.toShow();
				editStoryModal.toShow();

				// Get Friends List
				var friendRQ = new FriendRQ("friends", null, null);
				console.log(friendRQ);
				editStoryModal.loadFriendsInEvent();
			});

			e.preventDefault();
			return false;
		});
		// Hide Lightbos and Edit Story
		$( editStoryModal.root ).on('click',function(e){
			var target = $( e.target );
			if( e.target.id == 'jquploaddiv' ){
				// when users have finished uploadings, we should prevent accidental closing of upload-overlay 
				if( uploader !== null && 
						CollectionUtils.isNotEmpty(uploader.getUploads()) && 
						uploader.getUploads().length > 1 && 
						!uploader.isPending() ){
						console.trace();
					}
				else{
					if(console_enable == true) console.log( "editStoryModal root click: has no show class" );
					editStoryModal.toHide();
					lightboxModal.toHide();
				}
			}
		});

		$('.event-join', editStoryModal.root).on('click', function(e){
			$('.menu-widget .button-container.join', editStoryModal.root).addClass('show');
		});
		
		$('.menu-widget .button-container.join', editStoryModal.root).on('click',function(e){
			return false;
		});
		
		$('.event-show-box .grid.details-select span.show-details', editStoryModal.root).on('click',function(e){
				$('.event-show-box div.location').removeClass('show');
				$('.event-show-box div.details').addClass('show');
				$(this).parent().find('span').css('color','#000');
				$(this).css('color','#10A08E');
				return false;
		});
		
		$('.event-show-box .grid.details-select span.show-location', editStoryModal.root).on('click',function(e){
			editStoryModal.eventMap_view();
			$('.event-show-box div.location').addClass('show');
			$('.event-show-box div.details').removeClass('show');
			$(this).parent().find('span').css('color','#000');
			$(this).css('color','#10A08E');
			return false;
		});
			
		// edit / delete event
		$('.ui-btn.edit-event', editStoryModal.root).on('click',function(e){
			$('.event-show-box', editStoryModal.root).hide();
			$('.event-box', editStoryModal.root).show();
			$('button.ui-btn.update-event', editStoryModal.root).show();
			$('.menu-widget .button-container.edit', editStoryModal.root).removeClass('show');
			editStoryModal.eventMap_fixed(); 
			return false;
		});
		
		$('.ui-btn.delete-event', editStoryModal.root).on('click',function(e){
			if (confirm('confirm to delete event?')){
				var id = editStoryModal.content.id;
				new EventRQ("delete", {id: id}).fire().done(function(results){
					var eventRS = new EventRS(results);
					if(eventRS.IS_FAIL){
						console.warn(eventRS);
					}
					else{
						console.log("deleted");
						// TODO: close popup;
					}
				});					
			}
			$('.menu-widget .button-container.edit', editStoryModal.root).removeClass('show');

			return false;
		});
		
		// Event Joining
		$('.ui-btn.join-event,.ui-btn.quit-event', editStoryModal.root).on('click',function(e){
			var target = $(this);
			// var eventType = $(this).closest('.story.event').attr('data-event');
			var id = editStoryModal.content.id;

			if( target.hasClass('quit-event') ){
				new EventRQ("quit", {id: id}).fire().done(function(results){
					var eventRS = new EventRS(results);
					if(eventRS.IS_FAIL){
						console.warn(eventRS);
					}
					else{
						target.removeClass('joined');
						console.log("Not Joining");
						$('.event-join', editStoryModal.root).html("CAN'T GO");							
					}
				});
			}else{
				new EventRQ("join", {id: id}).fire().done(function(results){
					var eventRS = new EventRS(results);
					if(eventRS.IS_FAIL){
						console.warn(eventRS);
					}
					else{
						target.addClass('joined');
						console.log("Joined");
						$('.event-join', editStoryModal.root).html("GOING");
					}
				});
			}
			$('.menu-widget .button-container.join', editStoryModal.root).removeClass('show');

			return false;
		});
		
		$('.tab-list .ui-btn', editStoryModal.root).on('click',function(e){
			var postType = $(this).attr('data-post-type');
			$(createStoryModal.root).attr('data-post-type', postType);

			if( postType == 'event' ){
				eventUploader();
			}else{
				storyUploader();
			}

			return false;
		});			
		// Show Specific Popup Menu for event-edit
		$(".menu .ui-btn.menu, .menu .ui-btn.edit, .menu .ui-btn.privacy", editStoryModal.root ).on('click',function(e){
			var thisStory = $(this).closest(".event-edit-post");//.subject-container");
			var thisMenuWidget = $(thisStory).find(".menu-widget");
			var menuType = $(this).attr('data-menu-type');
			if( $(thisMenuWidget).find('.button-container.'+menuType).hasClass('show') ){
				$(editStoryModal.root).find(".menu-widget .button-container").removeClass('show');
				$(editStoryModal.root).find('.story').removeClass('show-menu');
				return false;
			}
			console.log(menuType);

			$(editStoryModal.root).find(".menu-widget .button-container").removeClass('show');
			$(thisMenuWidget).find('.button-container.'+menuType).addClass('show');

			$(editStoryModal.root).find('.story').removeClass('show-menu');
			$(thisStory).addClass('show-menu');

			$(thisStory).off('mouseleave');
			$(thisStory).on('mouseleave',function(e){
				$(editStoryModal.root).find(".menu-widget .button-container").removeClass('show');
				$(editStoryModal.root).find('.subject-container').removeClass('show-menu');
				console.log("Hide menu-widget");
				return false;
			});

			console.log("Show " + menuType + " menu-widget");
			return false;
		});		
		
		// Add Photo 
		$('.event-edit-post .event-box .ui-btn.add-photo', editStoryModal.root).on('click',function(e){
			$(this).next('INPUT:file#eventPhotoUpload').trigger('click');
			return false;
		});

		// add photo for event story
		$('.event-edit-post .event-story-box .header .ui-btn.add-photo', editStoryModal.root).on('click',function(e){
			$('.event-edit-post .event-story-box', editStoryModal.root).find('INPUT:file#eventStoryUpload').trigger('click');
			return false;
		});
		
		// post event story
		$('.event-edit-post .event-story-box .ui-btn.add-event-story', editStoryModal.root).on('click',function(e){
			var uploads = uploader.getUploads();
			var ivPhotos = (uploads.length > 0 && uploads[0].image != null)? [uploads[0].image]: null;
			var story = {groupId:editStoryModal.content.id};
			story["content"] = $(this).parent().find("input[name='content']").val();
			//			    story["photos"] = ivPhotos;
			//			    story["images"] = ivPhotos;
			story.url = ivPhotos[0].url;	
			story.mediaUrl = ivPhotos[0].url;
			console.log(story);
			story.width=600;
			story.height=600;
			story.isLandscape = true;
			new EventStoryRQ("create", {story: story} ).fire().done(function(results){
				console.log(results);
				//TODO: refresh the list
				editStoryModal.loadEventStoryList();							
			});
			$('.upload-box',editStoryModal.root).removeClass('show');
		});
		
		// Update Event
		$('.event-edit-post .ui-btn.update-event', editStoryModal.root).on('click',function(e){
			
			var eventTitle = $('.event-edit-post [name="event_name"]', editStoryModal.root).val();
			var eventDetails = $('.event-edit-post [name="event_details"]', editStoryModal.root).val();
			var eventBeginDate = $('.event-edit-post [name="start_date"]', editStoryModal.root).val();
			var eventEndDate = $('.event-edit-post [name="end_date"]', editStoryModal.root).val();
			var eventBeginTime = $('.event-edit-post [name="start_time"]', editStoryModal.root).val();
			var eventEndTime = $('.event-edit-post [name="end_time"]', editStoryModal.root).val();
			var privacyLevel = $('.event-edit-post .privacy-list', editStoryModal.root).attr('data-privacy');
			var eventLocation = $('.event-edit-post [name="event_location"]', editStoryModal.root).val();
			var isAllDay = $('.event-edit-post .all-day-event INPUT:checkbox', editStoryModal.root).is(":checked");

			if( eventTitle == '' ||  eventBeginDate == '' || eventEndDate == '' || eventDetails == '' ){
				alert('These fields in above are required :\nEvent Title\nEvent Details\nEvent Start Day\nEvent End Date');
				return false;
			}else if( $('.event-edit-post .friend-list.view-all').hasClass('show') ){
				alert('Please finish friends invitation process');
				return false;
			}

			//spinnerModal.toShow();

			var eventBegin = eventBeginDate + ' ' + eventBeginTime;
			var eventEnd = eventEndDate + ' ' + eventEndTime;
			var uploads = uploader.getUploads();
			var ivImages = (uploads.length > 0 && uploads[0].image != null)? [uploads[0].image]: null;

			var ivEvent = new Event({
				id: editStoryModal.content.id,
				name: eventTitle,
				description: eventDetails,
		        images: ivImages,
				begin: ((isAllDay)? dateAPI.toLocalDayStart([eventBegin]): dateAPI.from(eventBegin)).getTime(),
				end: ((isAllDay)? dateAPI.toLocalDayEnd([eventEnd]): dateAPI.from(eventEnd)).getTime()
			}).setDisplaylevel( privacyLevel );
			// Location Description
			ivEvent.location = StringUtils.stripToNull( eventLocation );

			// Google Map Date
			if( editStoryModal.myLocationStored ){
				if(editStoryModal.myLocationHotspot.latitude === editStoryModal.location_lat && editStoryModal.myLocationHotspot.longitude === editStoryModal.location_long ) {
					ivEvent.hotspot = editStoryModal.myLocationHotspot;
				}else{
					ivEvent.hotspot = {
						id: editStoryModal.content.id,
						code: eventLocation,
						latitude: editStoryModal.location_lat,
						longitude: editStoryModal.location_long
					};
				}
			}

			var participants = [];
			if( editStoryModal.isJoinable ){
				$('.event-edit-post .selected-list .list-item[data-user-id]').each(function(i,e){
					participants.push(  parseInt( $(e).attr('data-user-id') ) ); 
				});
			}
			var inviteRQ = (CollectionUtils.isNotEmpty(participants))?new EventRQ("invitePeople", {
				ids: participants, eventId: editStoryModal.content.id 
			}): null;
			//TODO: submit event update!
			console.log('to be submitted event:');
			console.log(ivEvent);
			new EventRQ("modify", {event: ivEvent}).fire().done(function(results){
				var eventRS = new EventRS(results);
				if(eventRS.IS_FAIL){
					console.warn(eventRS);
					alert("cannot update event");
				}
				else{
					console.groupCollapsed("EventRQ update All Done");
					console.log(eventRS);
					console.groupEnd();				
					spinnerModal.toHide();
					editStoryModal.toHide();
					lightboxModal.toHide();
					userHeader.dialogPosted('event');
				}
			});
			
			return false;
		});
					
		// UI checkbox-field
		$('.event-edit-post .checkbox-field .text', editStoryModal.root).on('click',function(e){
			var thischeckboxField = $(this).prev('INPUT:checkbox');
			$(thischeckboxField).trigger('click');
			return false;
		});
		$('.event-edit-post .all-day-event INPUT:checkbox', editStoryModal.root).on('change',function(e){
			var timepickerField = $(this).closest('.grid.date').find('.timepickerField'); // Extra Case
			if( !$(this).is(":checked") ){
				$(timepickerField).removeClass('hide'); // Extra Case
			}else{
				$(timepickerField).addClass('hide'); // Extra Cases
			}
		});
		$('.event-edit-post .joinable-event INPUT:checkbox', editStoryModal.root).on('change',function(e){
			if( !$(this).is(":checked") ){
				editStoryModal.isJoinable = false; // Extra Case
				editStoryModal.participantsListView('view-selected'); // Extra Case
			}else{
				editStoryModal.isJoinable = true; // Extra Case
			}
			editStoryModal.joinableTacker();
		});

		// Add Map Button
		$('.event-edit-post .ui-btn.add-map', editStoryModal.root).on('click',function(e){
			editStoryModal.currentLocation();
			editStoryModal.eventMap_draggable();
			return false;
		});

		// Ok Button Draggable Map
		$('.event-edit-post .grid.location .ui-btn.ok', editStoryModal.root).on('click',function(e){
			console.trace();
			editStoryModal.updateLocation();
			editStoryModal.eventMap_fixed();
			$("#event-map-draggable",editStoryModal.root).removeClass('show');
			editStoryModal.myLocationStored = true;
			return false;
		});

		// Cancel Button Draggable Map
		$('.event-edit-post .grid.location .ui-btn.cancel', editStoryModal.root).on('click',function(e){
			$("#event-map-draggable",editStoryModal.root).removeClass('show');
			return false;
		});

		// Edit Button Fixed Map
		$('.event-edit-post .grid.location .ui-btn.edit', editStoryModal.root).on('click',function(e){
			editStoryModal.eventMap_draggable();
			// $("#event-map-fixed").removeClass('show');
			return false;
		});

		// Remove Button Fixed Map
		$('.event-edit-post .grid.location .ui-btn.remove', editStoryModal.root).on('click',function(e){
			$('.event-edit-post .grid.location .map', editStoryModal.root).removeClass('show');
			editStoryModal.myLocationStored = false;
			return false;
		});

		// Header Invite
		$('.event-edit-post .header .ui-btn.invite', editStoryModal.root).on('click',function(e){

			editStoryModal.loadFriendsInEvent();  //refresh friendsInEvent()
			
			var targetList = $('.event-edit-post .block-list.checkable-list', editStoryModal.root);
			$(targetList).find('.list-item').removeClass('checked taken');
			$(targetList).find('.ui-btn.checkbox').removeClass('checked taken');
			$(targetList).find('INPUT:CHECKBOX').removeAttr('checked');

			var currenttList = $('.event-edit-post .block-list.selected-list .list-item:not(.empty)', editStoryModal.root);
			$(currenttList).each(function(i,e){
				var userID = $(this).attr('data-user-id');
				$(targetList).find('.list-item[data-user-id="' + userID +'"]').addClass('taken');
				$(targetList).find('.list-item[data-user-id="' + userID +'"] .ui-btn.checkbox').trigger('click').addClass('taken');
			});

			// var listItemCount =  $(targetList).find('.list-item:not(.empty)').length;
			$(targetList).find('.list-item.empty').appendTo( targetList );

			editStoryModal.participantsChecked();
			editStoryModal.participantsListView('view-all');
			return false;
		});

		// Header Cancel
		$('.event-edit-post .header .ui-btn.cancel', editStoryModal.root).on('click',function(e){
			editStoryModal.participantsListView('view-selected');
			return false;
		});
		
		// Select Invite
		$('.event-edit-post .control .ui-btn.invite', editStoryModal.root).on('click',function(e){
//			alert('Select invite');
			var targetList = $('.event-edit-post .block-list.selected-list', editStoryModal.root);
			$(targetList).find('.list-item:not(.empty)').remove();

			$('.event-edit-post .checkable-list .list-item.checked', editStoryModal.root).each(function(i,e){
				var tempEle = $(e).clone();
				$(tempEle).removeClass('checked taken').find('.ui-btn.checkbox, .icon').remove();

				var removeBtn = $("<button />").addClass('ui-btn remove').append('<span class="icon s12 green ui-close"></span>').appendTo( tempEle );
				$(removeBtn).on('click',function(e){
					$(this).closest('.list-item').remove();
					editStoryModal.participantsSaved();
					return false;
				});
				$(targetList).append( tempEle );
			});

			$(targetList).find('.list-item.empty').appendTo( targetList );

			editStoryModal.participantsSaved();
				//trigger invite
				var participants = [];
				console.log($('.event-edit-post .selected-list .list-item[data-user-id]'));
				$('.event-edit-post .selected-list .list-item[data-user-id]').each(function(i,e){
//					alert( parseInt( $(e).attr('data-user-id') ) );
					participants.push(  parseInt( $(e).attr('data-user-id') ) ); 
				});
				var inviteRQ = (CollectionUtils.isNotEmpty(participants))?new EventRQ("invitePeople", {
					ids: participants, eventId: editStoryModal.content.id 
				}): null;
				inviteRQ.eventId = editStoryModal.content.id;
				console.log(inviteRQ);
				inviteRQ.fire();
				
				//TODO: refresh participant list
						editStoryModal.loadInvitedList();
				
//				editStoryModal.participantsListView('view-selected');

			return false;
		});

		
		// Hide Privacy List
		$('.event-edit-post .privacy-list', editStoryModal.root).on('mouseleave',function(e){
			$(this).removeClass('show');
			if(console_enable == true) console.log( 'Hide Privacy Options List' );
			// return false;
		});

		// Privacy Button
		$('.event-edit-post .privacy-list .ui-btn:not(.privacy)', editStoryModal.root).on('click',function(e){
			var privacy_type = $(this).attr('data-privacy');
			var iconClass = $(this).attr('data-privacy');
			var content = $(this).find('.text').text();

			// Specifly for translate for icon system
			switch( iconClass.toLowerCase()) {
				case 'myself':
					iconClass = 'inviteOnly';
					break;
				case 'friends':
					iconClass = 'closeFriends';
					break;
				default:
					iconClass = 'public';
			}

			$('.event-edit-post .ui-btn.privacy', editStoryModal.root).find('.icon:not(.ui-triangle-down)').removeClass('public closeFriends inviteOnly').addClass( iconClass );
			$('.event-edit-post .ui-btn.privacy', editStoryModal.root).attr('data-privacy',privacy_type).find('.text').text( content );
			$('.event-edit-post', editStoryModal.root).attr('data-privacy',privacy_type);
			$('.event-edit-post .privacy-list', editStoryModal.root).attr('data-privacy',privacy_type);
			$(this).addClass('current').siblings().removeClass('current');

			$('.event-edit-post .privacy-list', editStoryModal.root).removeClass('show');

			console.log( privacy_type );
			if(console_enable == true) console.log( privacy_type );
			
			return false;
		});
		
		// Show Privacy List
		$('.event-edit-post .ui-btn.privacy', editStoryModal.root).on('click',function(e){
			$(this).next('.privacy-list').addClass('show');

			if(console_enable == true) console.log( 'Show Privacy Options List' );

			return false;
		});

		// tab3
		$('.event-edit-post .ui-btn.tab3', editStoryModal.root).on('click',function(e){
			$(".right_msg_box",editStoryModal.root).show();
			$(".event-story-box",editStoryModal.root).hide();
			$(".participants-box",editStoryModal.root).hide();
			$(this).parent().find('span').removeClass('show');
			$(this).find('span').addClass('show');
			return false;
		});
		
		// tab2
		$('.event-edit-post .ui-btn.tab2', editStoryModal.root).on('click',function(e){
			$(".right_msg_box",editStoryModal.root).hide();
			$(".event-story-box",editStoryModal.root).show();
			$(".participants-box",editStoryModal.root).hide();
			$(this).parent().find('span').removeClass('show');
			$(this).find('span').addClass('show');
			return false;
		});
		// tab1
		$('.event-edit-post .ui-btn.tab1', editStoryModal.root).on('click',function(e){
			$(".right_msg_box",editStoryModal.root).hide();
			$(".event-story-box",editStoryModal.root).hide();
			$(".participants-box",editStoryModal.root).show();
			$(this).parent().find('span').removeClass('show');
			$(this).find('span').addClass('show');
			return false;
		});
		$('.right-tabs .ui-btn.tabx', editStoryModal.root).on('click',function(e){
			editStoryModal.toHide();
			lightboxModal.toHide(); 
			return false;
        });
		
		$('.ui-btn[data-share]',  editStoryModal.root).on('click',function(e){
			var action = $(this).attr('data-share');
			var eventID = editStoryModal.content.id;
			if( eventID == null || eventID == 'undefined' ){
				console.error('Share button');
				alert('Event Id Not found');
				return false;
			}
			
			shareEventModal.toShow(eventID);
			//lightboxModal.toShow();
			return false;
		});		
		
	}
}

/*******************************************************************************
Create Story Modal Function
*******************************************************************************/
var GoogleSearchBox = {
	bind: function(modal, fieldID){
if (typeof google == 'undefined') return;		
       	var inputField = $(("#"+fieldID), modal.root)[0],
        	searchBox = new google.maps.places.SearchBox(inputField);
		google.maps.event.addListener(searchBox, 'places_changed', function() {
			modal.myLocationHotspot = null;
			var places = searchBox.getPlaces();
			if (places.length > 0){
				console.log(searchBox);
				console.log(places);
				var place = places[0];
				modal.myLocationHotspot = {
					code: place.place_id,
					name: place.name,
					reference: place.reference,
					googleId: place.id,
					googlePlaceId: place.place_id,
					address: place.formatted_address,
					latitude: place.geometry.location.lat(),
					longitude: place.geometry.location.lng(),
					googleType: CollectionUtils.isNotEmpty(place.types)?place.types.toString():null
				};
				modal.location_lat_temp = place.geometry.location.lat();
				modal.location_long_temp = place.geometry.location.lng();
				modal.myLocation_temp = new google.maps.LatLng( modal.location_lat_temp, modal.location_long_temp );
				modal.eventMap_draggable('bySearch');
				
			}
			console.groupCollapsed("SearchBox places_changed");
			console.log(places);
			console.log(modal.myLocationHotspot);
			console.groupEnd();

		});
	}
};
var createStoryModal = {
	debug : false,
	zoom: 17,
	currentView : null,
	delayTimer : 500,
	isJoinable : true,
	location_lat : 22.284641,
	location_long : 114.158107,
	location_lat_temp : null, 
	location_long_temp : null, 
	myLocation : null,
	myLocation_temp : null,
	myLocationHotspot : null, 
	myLocationStored : false,
	myLocationIcon : 'images/theme/all_icons/1x/newStoryEvent-map-marker-32px.png',
	root : false,
	init : function(){
		this.root = $('#create-story-modal');
		createStoryModal.toHide();
		lightboxModal.toHide();
		createStoryModal.bindFunctions();
		createStoryModal.resetValues();
		createStoryModal.initDropzone();
		GoogleSearchBox.bind(this, 'event_location');

		// Datepicker
		$(".ui-btn.datepickerInput", createStoryModal.root).datepicker({ 
			numberOfMonths: 2,
			dateFormat: 'dd M yy',
			maxDate: 0
		});
		$(".event-new-post .ui-btn.datepickerInput", createStoryModal.root).datepicker( 'destroy' ).datepicker({ 
			numberOfMonths: 1,
			dateFormat: 'dd M yy',
			minDate : 0
		});

		// Timepicker Init
		$('.ui-btn.timepickerInput', createStoryModal.root).timepicker({
			closeOnWindowScroll : true,
			'timeFormat': 'g:i a', 
			step : 15
		}).on('keyup keydown', function(e){
			e.preventDefault();
		});

		console.log( "createStoryModal Initialized" );
	},
	toShow : function(){
		createStoryModal.resetValues();
		$( createStoryModal.root ).addClass('show');
	},
	toHide : function(){
		$( createStoryModal.root ).removeClass('show');
		setTimeout(function(){
			createStoryModal.switchView('general');
			createStoryModal.resetValues();
		}, createStoryModal.delayTimer );
	},
	notEmpty : function(){
		$('.story-new-post', createStoryModal.root).removeClass('is-empty').addClass('not-empty');
	},
	isEmpty : function(){
		$('.story-new-post', createStoryModal.root).removeClass('not-empty').addClass('is-empty');
	},
	switchView : function(view){
		if( createStoryModal.debug ) {
			console.groupCollapsed("switchView: " + view);
			console.trace();
			console.groupEnd();
		}
		// Reset Uploader
		if( view == 'general' ){
			if( createStoryModal.debug ) console.log( 'Reset storyUploader()' );
			// storyUploader();
		}
		// Limit fire once
		if( createStoryModal.currentView != view ){
			$('.story-new-post', createStoryModal.root).attr('data-story-type', view);
			createStoryModal.currentView = view;
		}
	},
	hideDropzone : function(){
		createStoryModal.dropzoneShadow();
		$('.dropzone', createStoryModal.root).removeClass('show');	
	},
	showDropzone : function(){
		createStoryModal.dropzoneShadow();
		$('.dropzone', createStoryModal.root).addClass('show');	
	},
	initDropzone : function(){

		// If Brower supports Drag and Drop
		if (window.File && window.FileList && window.FileReader) {

			$(createStoryModal.root).on('dragover',function(event){
				event.stopPropagation();
				event.preventDefault();

				var storyType = $('.story-new-post', createStoryModal.root).attr('data-story-type');

				if( storyType == 'general' || storyType == 'storybook' ){

					createStoryModal.showDropzone();

					// Custom Event - Draover Finished
					if(this.dragTrack) clearTimeout(this.dragTrack);
					this.dragTrack = setTimeout(function() {
						createStoryModal.hideDropzone();
						if( createStoryModal.debug ) console.log('dragover');
						if( createStoryModal.debug ) console.log('dragover Finished');
					}, createStoryModal.delayTimer );
					if( createStoryModal.debug ) console.log('dragover Started');

				}
				return false;

			}).on('drop',function(event){
				event.stopPropagation();
				event.preventDefault();

				if( createStoryModal.debug ) console.log('Drop is not allowed');
				return false;
			});

			$('.dropbox', createStoryModal.root).on('dragenter',function(event){
				event.stopPropagation();
				event.preventDefault();

				$(this).siblings('.area').addClass('hover');

			}).on('dragleave',function(event){
				event.stopPropagation();
				event.preventDefault();

				$(this).siblings('.area').removeClass('hover');
			});

			$('.dropbox', createStoryModal.root).on('drop',function(event){
				event.stopPropagation();
				event.preventDefault();

				$('.dropzone', createStoryModal.root).removeClass('show');

				if( createStoryModal.debug ) console.log('Drop is not allowed');
				return false;
			});

			if( createStoryModal.debug ) console.log( 'This browser supports Drag & Drop' );

		}else{

			$('.dropzone', createStoryModal.root).remove();

			if( createStoryModal.debug ) console.log( 'This browser does not supports Drag & Drop' );
			
		}
	},
	dropzoneShadow : function(){
		if( $('.story-new-post', createStoryModal.root).attr('data-story-type') == 'storybook' ){
			$('.dropzone', createStoryModal.root).addClass('shadow');
		}else{
			$('.dropzone', createStoryModal.root).removeClass('shadow');
		}
	},
	storybookCounts : function(){
		// Close Lightbox and Create Modal if empty photobook
		var currentFound = $('[data-view-type="storybook"] .thumbnail', createStoryModal.root).length;
		if( currentFound < 1 ){
			createStoryModal.toHide();
			lightboxModal.toHide();
		}
	},
	resetValues : function(){
		$('INPUT, TEXTAREA', createStoryModal.root).val('');
		$('.storybook-list .container', createStoryModal.root).removeClass('active');
		$('.storybook-list .container', createStoryModal.root).removeClass('active');
		$('[data-view-type="storybook"] .display-content', createStoryModal.root).html('');
		$('[data-view-type="photo"] .input-col.photo', createStoryModal.root).html('');
		$('.ui-btn.add-to-storybook .text', createStoryModal.root).text('Select storybook');
		$('.ui-btn.privacy', createStoryModal.root).attr('data-privacy','public').find('.text').text('Public');
		$('.ui-btn.privacy', createStoryModal.root).find('.icon:not(.ui-triangle-down)').removeClass('public friends closeFriends myself inviteOnly').addClass('public');
		$('.privacy-list', createStoryModal.root).attr('data-privacy','public').find('.ui-btn').removeClass('current');
		$('.privacy-list .ui-btn[data-privacy="public"]:not(.privacy)', createStoryModal.root).addClass('current');
		createStoryModal.isEmpty();
		createStoryModal.switchView('general');
		
		createStoryModal.eventToStory();
		$('INPUT:CHECKBOX', createStoryModal.root).removeAttr('checked');
		$('.list-item', createStoryModal.root).removeClass('checked taken');
		$('.ui-btn.checkbox', createStoryModal.root).removeClass('checked taken');
		$('.event-new-post .grid.location .map', createStoryModal.root).removeClass('show');
		$('.event-new-post .block-list.checkable-list', createStoryModal.root).html('');
		$('.event-new-post .block-list.selected-list .ui-btn.remove', createStoryModal.root).trigger('click');
		createStoryModal.participantsListView('view-selected');
		$('.timepickerField', createStoryModal.root).removeClass('hide');
		$('.friend-list', createStoryModal.root).addClass('enabled');
		$('.event-new-post .joinable-event INPUT:checkbox', createStoryModal.root).prop('checked',true);
		createStoryModal.isJoinable = false;
		createStoryModal.location_lat = 22.284641;
		createStoryModal.location_long = 114.158107;
		createStoryModal.location_lat_temp = null;
		createStoryModal.location_long_temp = null; 
		createStoryModal.zoom = 17;

		if( createStoryModal.debug ) console.log( "createStoryModal Reset Values" );
	},
	joinableTacker : function(){
		if( createStoryModal.isJoinable ){
			$('.friend-list', createStoryModal.root).addClass('enabled');
		}else{
			$('.friend-list', createStoryModal.root).removeClass('enabled');
		}
	},
	eventToStory : function(){
		$(createStoryModal.root).attr('data-post-type','story');
		return false;
	},
	generalToPhoto : function(){

		var text = $('[data-view-type="general"] .textField', createStoryModal.root).val();
		var date = $('[data-view-type="general"] .datepickerInput', createStoryModal.root).val();

		$('[data-view-type="general"] .textField', createStoryModal.root).val('');
		$('[data-view-type="general"] .datepickerInput', createStoryModal.root).val('');
		
		$('[data-view-type="photo"] .textField', createStoryModal.root).val( text );
		$('[data-view-type="photo"] .datepickerInput', createStoryModal.root).val( date );

		// Switch to Single Photo View
		createStoryModal.switchView('photo');
		createStoryModal.notEmpty();

		return false;

	},
	generalToStorybook : function(){

		$('[data-view-type="general"] .textField', createStoryModal.root).val('');
		$('[data-view-type="general"] .datepickerInput', createStoryModal.root).val('');
		$('.ui-btn.add-to-storybook .text', createStoryModal.root).text('Select storybook');

		// Switch to Single Photo View
		createStoryModal.switchView('storybook');
		createStoryModal.notEmpty();

		return false;

	},
	photoToGeneral : function(){
		var text = $('[data-view-type="photo"] .textField', createStoryModal.root).val();
		var date = $('[data-view-type="photo"] .datepickerInput', createStoryModal.root).val();

		$('[data-view-type="photo"] .textField', createStoryModal.root).val('');
		$('[data-view-type="photo"] .datepickerInput', createStoryModal.root).val('');

		$('[data-view-type="general"] .textField', createStoryModal.root).val( text );
		$('[data-view-type="general"] .datepickerInput', createStoryModal.root).val( date );

		// Check and Trigger "StoryBook" and "DatePicker" Button Show Hide
		if( text == '' ){
			createStoryModal.isEmpty();
			// $('[data-view-type="general"] .datepickerInput', this.root).val( '' );
		}else{
			createStoryModal.notEmpty();
		}

		// Switch to General View
		createStoryModal.switchView('general');

		return false;

	},
	currentLocation : function(){
if (typeof google == 'undefined') return;		
		var location = new google.maps.LatLng( createStoryModal.location_lat, createStoryModal.location_long );
		createStoryModal.myLocation = location;
	},
	updateLocation : function(){
		if( createStoryModal.myLocation_temp == null ){
			createStoryModal.myLocation_temp = createStoryModal.myLocation;
		}
		createStoryModal.location_lat = createStoryModal.location_lat_temp;
		createStoryModal.location_long = createStoryModal.location_long_temp;
		createStoryModal.myLocation = createStoryModal.myLocation_temp;
	},
	eventMap_fixed : function(){
if (typeof google == 'undefined') return;		
		var mapOptions = {
			center : createStoryModal.myLocation,
			zoom : createStoryModal.zoom, 
			mapTypeId : google.maps.MapTypeId.ROADMAP,
	  		disableDefaultUI: true,
			draggable : false,
			panControl : false,
			mapTypeControl : false,
			mapTypeControlOptions : {
				style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			},
			zoomControl : false,
			zoomControlOptions : {
				style: google.maps.ZoomControlStyle.SMALL
			}
		};

		var map = new google.maps.Map($("#event-map-fixed",createStoryModal.root)[0], mapOptions);

		var marker = new google.maps.Marker({
			// position : new google.maps.LatLng( 22.284641, 114.158107 )
			position : createStoryModal.myLocation,
			map : map,
			// draggable : true,
			draggable : false,
			clickable : false, 
			animation : google.maps.Animation.DROP,
			icon: createStoryModal.myLocationIcon
		});

		console.log('Final location is : ' + createStoryModal.myLocation );

		google.maps.event.addListener(map, 'zoom_changed', function() {
			map.panTo(marker.getPosition());
		});

		google.maps.event.trigger(map, "resize");
		$("#event-map-fixed").addClass('show');
	},
	eventMap_draggable : function(arg){
if (typeof google == 'undefined') return;		

		var displayLocation = createStoryModal.myLocation;
		if(arg == 'bySearch'){
			displayLocation = createStoryModal.myLocation_temp;
		}

		var mapOptions = {
			// center : new google.maps.LatLng( 22.284641, 114.158107 ),
			center : displayLocation,
			zoom : createStoryModal.zoom, 
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			draggable : true,
			panControl : true,
			streetViewControl: false, 
			mapTypeControl : false,
			mapTypeControlOptions : {
				style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			},
			zoomControl : true,
			zoomControlOptions : {
				style: google.maps.ZoomControlStyle.SMALL
			}
		};

		var map = new google.maps.Map($("#event-map-draggable",createStoryModal.root)[0], mapOptions);

		google.maps.event.addListener(map, 'zoom_changed', function() {
			createStoryModal.zoom = map.getZoom();
			map.panTo(marker.getPosition());
		});

		var marker = new google.maps.Marker({
			// position : new google.maps.LatLng( 22.284641, 114.158107 )
			position : displayLocation,
			map : map,
			// draggable : true,
			draggable : true,
			animation : google.maps.Animation.DROP,
			icon: createStoryModal.myLocationIcon
		});

		console.log('Current location is : '+ createStoryModal.myLocation );

		// Update Marker Location 
		google.maps.event.addListener(marker, 'dragend', function(event) {
			// location_lat = event.latLng.lat();
			// location_long = event.latLng.lng();
			// myLocation = new google.maps.LatLng( location_lat, location_long );

			createStoryModal.location_lat_temp = event.latLng.lat();
			createStoryModal.location_long_temp = event.latLng.lng();
			createStoryModal.myLocation_temp = new google.maps.LatLng( createStoryModal.location_lat_temp, createStoryModal.location_long_temp );

			map.panTo(marker.getPosition());
			// console.log('final position is '+ event.latLng.lat() + ' / ' + event.latLng.lng() );
			console.log('Temp location is : '+ createStoryModal.myLocation_temp );
		});

		google.maps.event.trigger(map, "resize");
		$("#event-map-draggable",createStoryModal.root).addClass('show');

		// Render
		// setTimeout(function() {
			// google.maps.event.trigger(map, "resize");
			// $("#event-map-draggable").addClass('show');
			// google.maps.event.addListener(marker, 'click');

			// console.log('final position is '+ myLocation );
		// },200);
	},
	uploadImages : function(text,date){

		if(console_enable == true) console.log( "createStoryModal uploadImages stage" );

		// storyPhotoUpload

		// $('[data-view-type="general"] INPUT:file', createStoryModal.root).val('');
		// $('[data-view-type="general"] INPUT:file', createStoryModal.root).off('change');

		$('INPUT:file#storyPhotoUpload', createStoryModal.root).val('');
		$('INPUT:file#storyPhotoUpload', createStoryModal.root).off('change');

		$('INPUT:file#storyPhotoUpload', createStoryModal.root).on('change',function(e){
			if(console_enable == true) console.log( "createStoryModal storyPhotoUpload change" );
			
			// Single Photo View
			if( $(this)[0].files.length == 1 ){
				// alert( 'Single Photo View' );

				$('[data-view-type="general"] .textField', createStoryModal.root).val('');
				$('[data-view-type="general"] .datepickerInput', createStoryModal.root).val('');
				
				$('[data-view-type="photo"] .textField', createStoryModal.root).val( text );
				$('[data-view-type="photo"] .datepickerInput', createStoryModal.root).val( date );

				// Switch to Single Photo View
				createStoryModal.switchView('photo');
				createStoryModal.notEmpty();

			// StoryBook View
			}else if( $(this)[0].files.length > 1 ){

				// alert('Selected ' + $(this)[0].files.length + ' file(s)  - StoryBook View');
				// Switch to General View
				createStoryModal.switchView('storybook');

			// General View
			}else{

				// Check and Trigger "StoryBook" and "DatePicker" Button Show Hide
				if( text_general == '' ){
					createStoryModal.isEmpty();
				}else{
					createStoryModal.notEmpty();
				}

				// Switch to General View
				createStoryModal.switchView('general');

			}

			if(console_enable == true) console.log( "createStoryModal uploadImages Fired - Selected " + $(this)[0].files.length + " file(s)");

			return false;

		});

	},
	participantsListView : function(view){
		$('.friend-list', createStoryModal.root).removeClass('show');
		$('.friend-list.' + view , createStoryModal.root).addClass('show');
		$('.friend-list .content-scroller', createStoryModal.root).scrollTop(0);
		if(console_enable == true) console.log( "Event Friend-List show : " +  view );
	},
	participantsChecked : function(){
		var checkableList = $('.event-new-post .block-list.checkable-list', createStoryModal.root);
		var count = $(checkableList).find(':not(.taken) INPUT:checkbox:checked').length;
		// var count = $(checkableList).find('INPUT:checkbox:checked').length;
		if(count > 0){
			$('.event-new-post .control', createStoryModal.root).addClass('enabled selecting');
			$('.event-new-post .control .note .number', createStoryModal.root).text( count );
		}else{
			// $('.event-new-post .control.enabled .note', createStoryModal.root).text('Select friends...');
			$('.event-new-post .control', createStoryModal.root).removeClass('enabled selecting');
		}
		if(console_enable == true) console.log( "Event Friend Selected : " +  count );
	},
	participantsSaved : function(){
		var targetList = $('.event-new-post .block-list.selected-list', createStoryModal.root);
		var count =  $(targetList).find('.list-item:not(.empty)').length;
		if( count > 0 ){
			$(targetList).addClass('empty');
		}else{
			$(targetList).removeClass('empty');
		}
		if(console_enable == true) console.log( "Event Friend Saved : " +  count );
	},
	bindFunctions : function(){

		var privacy_type = 'public';
		var text_general = '';

		// Hide Lightbos and Create Story
		$( createStoryModal.root ).on('click',function(e){
			if( !$(this).find('.story-new-post').hasClass('active') && !$(this).find('.event-new-post').hasClass('active') ){
				
				// when users have finished uploadings, we should prevent accidental closing of upload-overlay 
				if( CollectionUtils.isNotEmpty(uploader.getUploads()) && uploader.getUploads().length > 1 && !uploader.isPending() ){
					console.trace();
				}
				else{
					if(console_enable == true) console.log( "createStoryModal root click: has no show class" );
					createStoryModal.toHide();
					lightboxModal.toHide();
				}

				// return false;
			}
		});

		// Add class to post element
		$('.story-new-post, .event-new-post', createStoryModal.root).on('mouseenter',function(e){
			$(this).addClass('active');
			return false;
		}).on('mouseleave',function(){
			$(this).removeClass('active');
			return false;
		});

		// Chnage Type Story / Event
		$('.tab-list .ui-btn', createStoryModal.root).on('click',function(e){
			var postType = $(this).attr('data-post-type');
			$(createStoryModal.root).attr('data-post-type', postType);

			if( postType == 'event' ){
				eventUploader();
			}else{
				storyUploader();
			}

			return false;
		});

		// Remove White Space
		$('INPUT, TEXTAREA', createStoryModal.root).on('blur',function(e){
			$(this).val( trim_whiteSpace( $(this).val() ) );
		});


		/*************** New Story ***************/
		// Show Storybook-List
		$('.ui-btn.add-to-storybook', createStoryModal.root).on('click',function(e){
			// console.warn("Show some loading icons");
			$.when( storybookListModal.toShow().promise() ).done(function( pBook ){
				if( pBook != null ){
					console.log( pBook.id );
					console.log( pBook.name );
				
					var storyType = $('.story-new-post', createStoryModal.root).attr('data-story-type');
					// var listItem = that.closest('.list-item').find('.title').text();
					// var addStoryID = parseInt( $(this).closest('.list-item').attr('data-storybook-id') );
					$('.story-new-post[data-story-type="' + storyType + '"]', createStoryModal.root).find('.ui-btn.add-to-storybook .text').text( pBook.name );
					$('.story-new-post [data-view-type="storybook"]', createStoryModal.root).find('INPUT[name="title"]').val('');
					$('INPUT[type="hidden"].add-to-storybook', createStoryModal.root).val( pBook.id );
				// console.log('added to storybook ID : ' + addStoryID);
				}
			});
			return false;
		});

		// Hide Privacy List
		$('.story-new-post .privacy-list', createStoryModal.root).on('mouseleave',function(e){
			$(this).removeClass('show');

			if(console_enable == true) console.log( 'Hide Privacy Options List' );

			// return false;
		});

		// Privacy Button
		$('.story-new-post .privacy-list .ui-btn:not(.privacy)', createStoryModal.root).on('click',function(e){
			var privacy_type = $(this).attr('data-privacy');

			var content = $(this).find('.text').text();

			$('.story-new-post .ui-btn.privacy', createStoryModal.root).find('.icon:not(.ui-triangle-down)').removeClass('public friends closeFriends myself').addClass(privacy_type);
			$('.story-new-post .ui-btn.privacy', createStoryModal.root).attr('data-privacy',privacy_type).find('.text').text( content );
			$('.story-new-post', createStoryModal.root).attr('data-privacy',privacy_type);
			$('.story-new-post .privacy-list', createStoryModal.root).attr('data-privacy',privacy_type);
			$(this).addClass('current').siblings().removeClass('current');

			$('.story-new-post .privacy-list', createStoryModal.root).removeClass('show');

			console.log( privacy_type );
			if(console_enable == true) console.log( privacy_type );
			
			return false;
		});

		// Show Privacy List
		$('.story-new-post .ui-btn.privacy', createStoryModal.root).on('click',function(e){
			$(this).next('.privacy-list').addClass('show');

			if(console_enable == true) console.log( 'Show Privacy Options List' );

			return false;
		});

		// GENERAL text - Check and Trigger "StoryBook" and "DatePicker" Button Show Hide
		$('[data-view-type="general"] .textField, [data-view-type="photo"] .textField', createStoryModal.root).on('blur',function(e){
			text_general = trim_whiteSpace( $(this).val() );
			$(this).val( text_general );
		});

		// PHOTO text
		$('[data-view-type="photo"] .textField', createStoryModal.root).on('keyup input',function(e){
			text_general = $(this).val();
		});

		// GENERAL text - Check and Trigger "StoryBook" and "DatePicker" Button Show Hide
		$('[data-view-type="general"] .textField', createStoryModal.root).on('keyup input',function(e){
			text_general = $(this).val();

			if( text_general.indexOf('http://') > -1 ){
				// alert('ew');
				console.log('Found http:// in textarea');
			}

			if( text_general == '' ){
				createStoryModal.isEmpty();
			}else{
				createStoryModal.notEmpty();
			}

		});

		// Storybook Title & Datepicker
		$('[data-view-type="storybook"] INPUT[name="title"]', createStoryModal.root).on('keyup input',function(e){
			$(this).closest('.section').find('.ui-btn.add-to-storybook .text').text('Select storybook');
			$('INPUT[type="hidden"].add-to-storybook').val('');
			// console.log('remove addStoryID');
		});
		$('[data-view-type="storybook"] INPUT[name="title"]', createStoryModal.root).on('blur',function(e){
			var title = trim_whiteSpace( $(this).val() );
			$(this).val( title );
		});

		// Add Photo Button 
		$('.story-new-post .ui-btn.add-photo', createStoryModal.root).on('click',function(e){

			var text = $('[data-view-type="general"] .textField', createStoryModal.root).val();
			var date = $('[data-view-type="general"] .datepickerInput', createStoryModal.root).val();

			$('INPUT:file#storyPhotoUpload').trigger('click');

			// createStoryModal.uploadImages(text,date);

			return false;
		});

		// Website Text-Field
		$('[data-view-type="website"] .ui-btn.remove-url', createStoryModal.root).on('click',function(){
			createStoryModal.switchView('general');
			return false;
		});

		// Post Story BUTTON
		$('.story-new-post .ui-btn.post', createStoryModal.root).on('click',function(e){
			if(!uploader.isPending()){
				
				var story_Type = $(this).closest('.story-new-post').attr('data-story-type');
				var ivDisplayLevel = translateLevel( $('.story-new-post .menu .ui-btn.privacy', createStoryModal.root).attr('data-privacy') );
	
				console.groupCollapsed("Post:");
				var ivStoryBookID = $('.story-new-post INPUT[type="hidden"].add-to-storybook', createStoryModal.root).val();
				var ivStoryBookName = $('.story-new-post [data-view-type="' + story_Type + '"] INPUT[name="title"]', createStoryModal.root).val();
				var ivStoryBookDate = $('.story-new-post [data-view-type="' + story_Type + '"] .meta-content .ui-btn.datepickerInput', createStoryModal.root).val();
				
				var ivStoryDate = $('.story-new-post [data-view-type="' + story_Type + '"] .ui-btn.datepickerInput', createStoryModal.root).val();	
				var ivStoryContent = $('.story-new-post [data-view-type="' + story_Type + '"] .textField', createStoryModal.root).val();
				console.log("story_Type = " + story_Type);
				console.log("ivDisplayLevel = " + ivDisplayLevel);
				
				console.log("ivStoryBookID = " + ivStoryBookID);
				console.log("ivStoryBookName = " + ivStoryBookName);
				console.log("ivStoryBookDate = " + ivStoryBookDate);
				
				console.log("ivStoryDate = " + ivStoryDate);
				console.log("ivStoryContent = " + ivStoryContent);
				console.groupEnd();
				
				// Choose submit method by story_Type
				switch( story_Type ) {
					case "storybook":{
						if((ivStoryBookID != null && ivStoryBookID != "") || (ivStoryBookName != null && ivStoryBookName != "")){
							var storybook = new Storybook({
								id: ivStoryBookID,
								name: ivStoryBookName
							});
							var uploads = uploader.getUploads();
							for(var i=0; i < uploads.length; i++){
								var ivContent = uploads[i];
								var ivElems = ivContent.elems;
								var ivText = ivElems.textField.val();
								var ivDateLong = dateAPI.from( ivElems.dateInput.val() != null && ivElems.dateInput.val() != "" ? 
									ivElems.dateInput.val(): ivStoryBookDate ).getTime();
								var ivPhotos = ivContent.image == null? null: [ivContent.image];
								storybook.addStory(new Story({
							        content: ivText,
							        begin: ivDateLong,
							        end: ivDateLong,
							        displayLevel: ivDisplayLevel,
							        photos: ivPhotos
								}));
							}
							var promisedResult = storybook.post("create");
							promisedResult.done(function(pEvent, pBook){
								console.log("Post StoryBook Complete");
								createStoryModal.toHide();
								lightboxModal.toHide();
								userHeader.dialogPosted('storybook');
							});
						}
						else{
							console.error("Cannot post Storybook without book ID nor name");
						}
						break;
					}
					default:{
						var uploads = uploader.getUploads();
						var ivGroupId = (ivStoryBookID != null && ivStoryBookID != "")? ivStoryBookID: null;
						var ivPhotos = (uploads.length > 0 && uploads[0].image != null)? [uploads[0].image]: null;
						var ivDateLong = dateAPI.from(ivStoryDate).getTime();
						var story = new Story({
							groupId: ivGroupId,
							content: ivStoryContent,
							displayLevel: ivDisplayLevel,
							begin: ivDateLong,
							end: ivDateLong,
					        photos: ivPhotos
						}); 
						var promisedResult = story.post("create");
						// promisedResult.done(function(result){
						// 	if(console_enable == true) console.log("Post Story Complete");
						// 	createStoryModal.toHide();
						// 	lightboxModal.toHide();
						// 	userHeader.dialogPosted('story');
						// });
						break;
					}
				}

			}
			return false;
		});

		/*************** New Event ***************/
		// Hide Privacy List
		$('.event-new-post .privacy-list', createStoryModal.root).on('mouseleave',function(e){
			$(this).removeClass('show');
			if(console_enable == true) console.log( 'Hide Privacy Options List' );
			// return false;
		});

		// Privacy Button
		$('.event-new-post .privacy-list .ui-btn:not(.privacy)', createStoryModal.root).on('click',function(e){
			var privacy_type = $(this).attr('data-privacy');
			var iconClass = $(this).attr('data-privacy');
			var content = $(this).find('.text').text();

			// Specifly for translate for icon system
			switch( iconClass.toLowerCase()) {
				case 'myself':
					iconClass = 'inviteOnly';
					break;
				case 'friends':
					iconClass = 'closeFriends';
					break;
				default:
					iconClass = 'public';
			}

			$('.event-new-post .ui-btn.privacy', createStoryModal.root).find('.icon:not(.ui-triangle-down)').removeClass('public closeFriends inviteOnly').addClass( iconClass );
			$('.event-new-post .ui-btn.privacy', createStoryModal.root).attr('data-privacy',privacy_type).find('.text').text( content );
			$('.event-new-post', createStoryModal.root).attr('data-privacy',privacy_type);
			$('.event-new-post .privacy-list', createStoryModal.root).attr('data-privacy',privacy_type);
			$(this).addClass('current').siblings().removeClass('current');

			$('.event-new-post .privacy-list', createStoryModal.root).removeClass('show');

			console.log( privacy_type );
			if(console_enable == true) console.log( privacy_type );
			
			return false;
		});

		// Show Privacy List
		$('.event-new-post .ui-btn.privacy', createStoryModal.root).on('click',function(e){
			$(this).next('.privacy-list').addClass('show');

			if(console_enable == true) console.log( 'Show Privacy Options List' );

			return false;
		});

		// Header Invite
		$('.event-new-post .header .ui-btn.invite', createStoryModal.root).on('click',function(e){
			var targetList = $('.event-new-post .block-list.checkable-list', createStoryModal.root);
			$(targetList).find('.list-item').removeClass('checked taken');
			$(targetList).find('.ui-btn.checkbox').removeClass('checked taken');
			$(targetList).find('INPUT:CHECKBOX').removeAttr('checked');

			var currenttList = $('.event-new-post .block-list.selected-list .list-item:not(.empty)', createStoryModal.root);
			$(currenttList).each(function(i,e){
				var userID = $(this).attr('data-user-id');
				$(targetList).find('.list-item[data-user-id="' + userID +'"]').addClass('taken');
				$(targetList).find('.list-item[data-user-id="' + userID +'"] .ui-btn.checkbox').trigger('click').addClass('taken');
			});

			// var listItemCount =  $(targetList).find('.list-item:not(.empty)').length;
			$(targetList).find('.list-item.empty').appendTo( targetList );

			createStoryModal.participantsChecked();
			createStoryModal.participantsListView('view-all');
			return false;
		});

		// Header Cancel
		$('.event-new-post .header .ui-btn.cancel', createStoryModal.root).on('click',function(e){
			createStoryModal.participantsListView('view-selected');
			return false;
		});

		// Select Invite
		$('.event-new-post .control .ui-btn.invite', createStoryModal.root).on('click',function(e){
			// alert('Select invite');
			var targetList = $('.event-new-post .block-list.selected-list', createStoryModal.root);
			$(targetList).find('.list-item:not(.empty)').remove();

			$('.event-new-post .checkable-list .list-item.checked', createStoryModal.root).each(function(i,e){
				var tempEle = $(e).clone();
				$(tempEle).removeClass('checked taken').find('.ui-btn.checkbox, .icon').remove();

				var removeBtn = $("<button />").addClass('ui-btn remove').append('<span class="icon s12 green ui-close"></span>').appendTo( tempEle );
				$(removeBtn).on('click',function(e){
					$(this).closest('.list-item').remove();
					createStoryModal.participantsSaved();
					return false;
				});
				$(targetList).append( tempEle );
			});

			$(targetList).find('.list-item.empty').appendTo( targetList );

			createStoryModal.participantsSaved();
			createStoryModal.participantsListView('view-selected');

			return false;
		});

		// Add Photo 
		$('.event-new-post .ui-btn.add-photo', createStoryModal.root).on('click',function(e){
			$(this).next('INPUT:file#eventPhotoUpload').trigger('click');
			return false;
		});

		// Sync DatePicker
		$(".event-new-post .ui-btn.datepickerInput[name='start_date']", createStoryModal.root).on('change input',function(e){
			var thisValue = $(this).val();
			$(".event-new-post .ui-btn.datepickerInput[name='end_date']", createStoryModal.root).val( thisValue );
		});

		// Create Event
		$('.event-new-post .ui-btn.create-event', createStoryModal.root).on('click',function(e){

			var eventTitle = $('.event-new-post [name="event_name"]', createStoryModal.root).val();
			var eventDetails = $('.event-new-post [name="event_details"]', createStoryModal.root).val();
			var eventBeginDate = $('.event-new-post [name="start_date"]', createStoryModal.root).val();
			var eventEndDate = $('.event-new-post [name="end_date"]', createStoryModal.root).val();
			var eventBeginTime = $('.event-new-post [name="start_time"]', createStoryModal.root).val();
			var eventEndTime = $('.event-new-post [name="end_time"]', createStoryModal.root).val();
			var privacyLevel = $('.event-new-post .privacy-list', createStoryModal.root).attr('data-privacy');
			var eventLocation = $('.event-new-post [name="event_location"]', createStoryModal.root).val();
			var isAllDay = $('.event-new-post .all-day-event INPUT:checkbox', createStoryModal.root).is(":checked");
			var isJoinable = $('.event-new-post .joinable-event INPUT:checkbox', createStoryModal.root).is(":checked");

			if( eventTitle == '' ||  eventBeginDate == '' || eventEndDate == '' ){
				alert('These fields in above are required :\nEvent Title\nEvent Start Day\nEvent End Date');
				return false;
			}else if( $('.event-new-post .friend-list.view-all').hasClass('show') ){
				alert('Please finish friends invitation process');
				return false;
			}else if( $('.event-new-post .grid.location #event-map-draggable').hasClass('show') ){
				alert('Please confirm the draggable Map');
				return false;
			}

			spinnerModal.toShow();

			var eventBegin = eventBeginDate + ' ' + eventBeginTime;
			var eventEnd = eventEndDate + ' ' + eventEndTime;

			var ivEvent = new Event({
				name: eventTitle,
				description: eventDetails,
				begin: ((isAllDay)? dateAPI.toLocalDayStart([eventBegin]): dateAPI.from(eventBegin)).getTime(),
				end: ((isAllDay)? dateAPI.toLocalDayEnd([eventEnd]): dateAPI.from(eventEnd)).getTime(),
				isAllDay : isAllDay,
				isJoinable : isJoinable

			}).setDisplaylevel( privacyLevel );
			console.log(ivEvent);

			// Location Description
			ivEvent.location = StringUtils.stripToNull( eventLocation );

			// Google Map Date
			if( createStoryModal.myLocationStored ){

				if(createStoryModal.myLocationHotspot !== null && 
					createStoryModal.myLocationHotspot.latitude === createStoryModal.location_lat && 
					createStoryModal.myLocationHotspot.longitude === createStoryModal.location_long ) {
					ivEvent.hotspot = createStoryModal.myLocationHotspot;
				}else{
					eventLocation = StringUtils.isEmpty(eventLocation)? 
						createStoryModal.location_lat + ',' + createStoryModal.location_long: 
						eventLocation;
					ivEvent.hotspot = {
						code: eventLocation,
						latitude: createStoryModal.location_lat,
						longitude: createStoryModal.location_long
					};
				}
			}

			var participants = [];
			if( createStoryModal.isJoinable ){
				$('.event-new-post .selected-list .list-item[data-user-id]').each(function(i,e){
					participants.push(  parseInt( $(e).attr('data-user-id') ) ); 
				});
			}
			var inviteRQ = (CollectionUtils.isNotEmpty(participants))?new EventRQ("invitePeople", {
				ids: participants, eventId: editStoryModal.content.id
			}): null;

			EventRQ.sequentialPost(uploader, ivEvent, inviteRQ).done(function(data){
				console.groupCollapsed("EventRQ sequentialPost All Done");
				console.log(data);
				console.groupEnd();

				spinnerModal.toHide();
				createStoryModal.toHide();
				lightboxModal.toHide();
				userHeader.dialogPosted('event');

			});

			return false;

		});

		// UI checkbox-field
		$('.event-new-post .checkbox-field .text', createStoryModal.root).on('click',function(e){
			var thischeckboxField = $(this).prev('INPUT:checkbox');
			$(thischeckboxField).trigger('click');
			return false;
		});
		$('.event-new-post .all-day-event INPUT:checkbox', createStoryModal.root).on('change',function(e){
			var timepickerField = $(this).closest('.grid.date').find('.timepickerField'); // Extra Case
			if( !$(this).is(":checked") ){
				$(timepickerField).removeClass('hide'); // Extra Case
			}else{
				$(timepickerField).addClass('hide'); // Extra Cases
			}
		});
		$('.event-new-post .joinable-event INPUT:checkbox', createStoryModal.root).on('change',function(e){
			if( !$(this).is(":checked") ){
				createStoryModal.isJoinable = false; // Extra Case
				createStoryModal.participantsListView('view-selected'); // Extra Case
			}else{
				createStoryModal.isJoinable = true; // Extra Case
			}
			createStoryModal.joinableTacker();
		});

		// Add Map Button
		$('.event-new-post .ui-btn.add-map', createStoryModal.root).on('click',function(e){
			createStoryModal.currentLocation();
			createStoryModal.eventMap_draggable();
			return false;
		});

		// Ok Button Draggable Map
		$('.event-new-post .grid.location .ui-btn.ok', createStoryModal.root).on('click',function(e){
			console.trace();
			createStoryModal.updateLocation();
			createStoryModal.eventMap_fixed();
			$("#event-map-draggable",createStoryModal.root).removeClass('show');
			createStoryModal.myLocationStored = true;
			return false;
		});

		// Cancel Button Draggable Map
		$('.event-new-post .grid.location .ui-btn.cancel', createStoryModal.root).on('click',function(e){
			$("#event-map-draggable",createStoryModal.root).removeClass('show');
			return false;
		});

		// Edit Button Fixed Map
		$('.event-new-post .grid.location .ui-btn.edit', createStoryModal.root).on('click',function(e){
			createStoryModal.eventMap_draggable();
			// $("#event-map-fixed").removeClass('show');
			return false;
		});

		// Remove Button Fixed Map
		$('.event-new-post .grid.location .ui-btn.remove', createStoryModal.root).on('click',function(e){
			$('.event-new-post .grid.location .map', createStoryModal.root).removeClass('show');
			createStoryModal.myLocationStored = false;
			return false;
		});

		if(console_enable == true) console.log( "createStoryModal Bind Function" );

	}

}

var profile_obj = eval("(" + $.cookie("LOGINPROFILE") + ")");

var eventComment = {
	    renderDetail:{},
	    shareObj:{},
	    store: {},
	    dataObj: {},
	    init: function() {        
	        $('.right_msg_box #post_comment', editStoryModal.root).animate({scrollTop: 0}, "slow");
	    	$('div#post_comment',editStoryModal.root).html('');
	    	
	        // GET COMMENT
	        var storyId = editStoryModal.content.id
	        var storyType = "";
	        id = storyId;
	        eventComment.dataObj.id = storyId;
	        eventComment.dataObj.offset = 0;
	        eventComment.dataObj.limit = 10;
	        eventComment.requestComment(eventComment.dataObj, "/rest/eventComment/list");

	        eventComment.resizeInputComment();

	        $('.right_msg_box #post_comment', editStoryModal.root).bind('scroll', function()
	        {
	            if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight)
	            {
	            	eventComment.requestComment(eventComment.dataObj, "/rest/eventComment/list");
	            }
	        })
	        // $('.msg_box .close').bind('click', function() {
	        //     parent.$.colorbox.close();
	        // });
	        // $('.footerBar .can_share').on('click', function(e) {
	        //     return false;
	        // });
	        eventComment.clearTextarea($(".status_box textarea", editStoryModal.root));
	    },
	    storySide:function(slide_story){
			alert("TODO");
	    },		
	    expand: function(element) {
	        $(element).parent().find('.small').toggleClass('big');
	        if ($(element).parent().find("article").hasClass("big")) {
	            $(element).text("Show Less");
	        } else {
	            $(element).text("Show More");
	        }
	    },
	    hideAndShow: function(element, id) {
	        if (element.length > 96) {
	            return "Show More";
	        } else {
	            return "";
	        }
	    },		
	    countComment: function(type,id,obj) {
	        var tpl = $(".wrapper .msg_box");
	        this_comment = $(".comment_"+id)
	        iconClass = "." + type + "_icon";
	        unclick_iconClass = "comments-" + type;
	        click_iconClass = "comments-" + type+"d";
	        
	        eventComment.store[type+"_"+id] = obj[type+"Count"]        
	        eventComment.store[type+"_behaviar"+id] =0;
	        if(obj.myFollows.length>=1){ 
	            myFollows = obj.myFollows[0]
	            
	            if(myFollows=="LIKE")
	            	eventComment.store["like_behaviar"+id] = 1
	            else
	            	eventComment.store["dislike_behaviar"+id] = 1
	        }     
	        return eventComment.store[type+"_"+id];
	    },		
	    commentStatus: function(id) {    
	        type = id.split("_")[0]
	        this_id = id.split("_")[1]
	        this_commentTable = ".comment_"+this_id
	        iconClass = "." + type + "_icon";
	        unclick_iconClass = "comments-" + type;
	        click_iconClass = "comments-" + type+"d";
	        element = id.split("_")[0] + "_num";
	        behave =eventComment.store[type + "_behaviar" + this_id]
	        sendData = {}
	        sendData.id = id.split("_")[1];
	        //
	        switch (type) {
	            case "like":
	                affectType = "dislike";
	                break;
	            case "dislike":
	                affectType = "like";
	                break;
	        }
	        if (behave ^ eventComment.store[affectType + "_behaviar" + this_id] && !behave) {
	        	eventComment.commentBehaviar(affectType,this_id);
	        }
	        switch (behave) {
	            case 1:
	            	eventComment.store[id] -= 1;
	            	eventComment.store[type+"_behaviar"+this_id]= 0;
	            path = "/rest/eventComment/un"+id.split("_")[0];   
	            $(this_commentTable).find(iconClass + " .icon").removeClass(click_iconClass).addClass(unclick_iconClass);
	            break;
	        case 0:
	        	eventComment.store[id] += 1;
	        	eventComment.store[type+"_behaviar"+this_id]= 1 
	            path = "/rest/eventComment/"+id.split("_")[0];   
	            $(this_commentTable).find(iconClass + " .icon").removeClass(unclick_iconClass).addClass(click_iconClass);
	            break;
	        }
	        
	        $(this_commentTable).find('.icon_commet .' + element).text(eventComment.store[id]);
	        sendData = {}
	        sendData.id = id.split("_")[1];
	        eventComment.changeStatus(path, sendData);// regular status call 
	    },		
	    commentBehaviar: function(affectType,this_id) {
	        this_commentTable = ".comment_"+this_id
	        affectIconClass = "." + affectType+ "_icon";
	        unclick_affect = "comments-" + affectType;
	        clicked_affect = "comments-" + affectType + "d"
	        affectType_num = eventComment.store[affectType+"_"+ this_id]

	        eventComment.store[affectType + "_behaviar" + this_id] = 0;
	        eventComment.store[affectType+"_"+ this_id] --;
	                
	        $(this_commentTable).find('.' + affectType+"_num").text(eventComment.store[affectType+"_"+ this_id]);
	        $(this_commentTable).find(affectIconClass + " .icon").removeClass(clicked_affect).addClass(unclick_affect);
	        postPath = "/rest/eventComment/un" + affectType;
	        eventComment.sendData = {}
	        eventComment.sendData.id = this_id;
	    },		
	    mainComment: function(commentType) {
	        iconClass = "." + commentType.split("_")[0] + "_icon";
	        unclick_status = "social-" + commentType.split("_")[0];
	        apiPath = commentType.split("_")[0];
	        clicked_status = (commentType.split("_")[0] != "support") ? "social-" + commentType.split("_")[0] + "d" : "social-" + commentType.split("_")[0] + "ed";
	        switch (apiPath) {
	            case "like":
	                affectType = "dislike_num";
	                break;
	            case "dislike":
	                affectType = "like_num";
	                break;
	            default:
	                affectType = "support_num";
	                break;
	        }

	        if (eventComment.store[commentType + "_behaviar" + id] ^ eventComment.store[affectType + "_behaviar" + id] && !eventComment.store[commentType + "_behaviar" + id]) {
	        	eventComment.statusBehaviar(affectType);
	        }
	        switch (store[commentType + "_behaviar" + id]) {
	            case 0:
	            	eventComment.store[commentType + "_behaviar" + id] = 1
	            	eventComment.store[commentType + id] += 1;
	                $(".msg_box",editStoryModal.root).find(iconClass + " .icon").removeClass(unclick_status).addClass(clicked_status);
	                path = "/rest/event/" + apiPath;
	                break;
	            case 1:
	            	eventComment.store[commentType + "_behaviar" + id] = 0;
	            	eventComment.store[commentType + id] -= 1;
	                $(".msg_box",editStoryModal.root).find(iconClass + " .icon").removeClass(clicked_status).addClass(unclick_status);
	                path = "/rest/event/un" + apiPath;
	                break
	        }
	        eventComment.sendData = {}
	        eventComment.sendData.id = id;
	        eventComment.changeStatus(path, sendData);// regular status call 

	        $(".msg_box", editStoryModal.root).find('.' + commentType).text(eventComment.store[commentType + id]);
	    },		
	    resizeInputComment: function() {
	    	return false;
	        textarea = $(".post_status .status_box textarea", editStoryModal.root);
	        $(".msg_box .status_box", editStoryModal.root).focusin(function(event) {
	            $(textarea).parent().parent().css("height", "140px");
	            $(textarea).css("width", "380px");
	            $(textarea).css("height", "90px");
	            $(textarea).parent().find("button").css("margin-top", "4px");
	            $(textarea).parent().find("button").css("float", "right");
	            $(textarea).parent().find("button").css("margin-right", "5px");
	        })
	        $(document).click(function(event) {
	            if (!$(event.target).is(".post_status .status_box button") && !$(event.target).is(".post_status .status_box textarea")) { //TODO
	                eventComment.clearTextarea(textarea);
	            }
	        })
	    },		
	    dateFormat: function(showDate) {
	        var showDate = dateAPI.from(showDate);
	        return dateStr = showDate.into('d MMM yyyy').toUpperCase() + ' ' + showDate.into('h:mm n').toUpperCase();
	    },		
	    fillUpPassVal: function(obj) {
			//TODO
	    	alert("TODO");
	    },
	    photoResize: function(obj) {
	        console.log(Object.keys(obj.photos).length)
	        if(Object.keys(obj.photos).length > 0){ 
	            resize = obj.photos[0].url.replace(/.png/g, "_original.png");
	        }else{
	            resize ="";
	        }
	        console.log(resize)
	        return resize;
	    },		
	    chk_scroll: function(e)
	    {   
	        console.log("run")
	        var elem = $(e.currentTarget);
	        if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight())
	        {
	            
	        	eventComment.requestComment(eventComment.dataObj, "/rest/eventComment/list")
	        }

	    },
	    clearTextarea: function(tpl) {
	        tpl.val("");
	        tpl.parent().parent().css("height", "50px");
	        tpl.css("width", "285px");
	        tpl.css("height", "30px");
	        tpl.parent().find("textarea").css("vertical-align", "bottom");
	        tpl.parent().find("button").css("margin-top", "0px");
	    },		
	    requestComment: function(postData, api) { // request for comment list 

	        $.ajax({
	            type: "POST",
	            contentType: "application/json; charset=UTF-8",
	            url: serverPath + api,
	            data: JSON.stringify(postData),
	            dataType: "json",
	            xhrFields: {
	                withCredentials: true
	            },
	            success: function(data) {    
	                if (data.status.code === "0000") {
	                    commentObj = data.messages[0].info.content.comments;
	                    console.log(commentObj);
	                    if (Object.keys(commentObj).length != 0) {
	                        $(".wrapper .no_msg", editStoryModal.root).css("display", "none");
	                        $(".wrapper .post_comment", editStoryModal.root).css("display", "block");
	                        $(".wrapper .post_comment", editStoryModal.root).empty()
//	                     $(".wrapper .post_comment").append(renderingComment(commentObj));
	                        $("#tmplItem").tmpl(commentObj).appendTo(".wrapper .post_comment");
	                        eventComment.dataObj.offset += 10;
	                    } else {
	                        if ($(".wrapper .post_comment table", editStoryModal.root).length <= 0) {
	                            $(".wrapper .no_msg", editStoryModal.root).css("display", "block");
		                        $(".wrapper .post_comment", editStoryModal.root).css("display", "none");
	                        }
	                    }
	                }
	                else {
	                    $(".wrapper .no_msg", editStoryModal.root).css("display", "block");
	                }
	            },
	            error: function(data) {
	                alert("Error");
	            }
	        });
	    },		
	    submitComment: function(api) {
	        if ($(".status_box textarea", editStoryModal.root).val() != "") {
	            comment = $(".status_box textarea", editStoryModal.root).val();
	            postParam = {};
	            postParam.eventComment = {};
	            postParam.eventComment.eventId = id;
	            postParam.eventComment.content = comment;
	            postParam.eventComment.title = '';
	            eventComment.changeStatus(api,postParam,"post_comment")            
	            // update counter
	            var counterElm = $('.icon.s24.grid-eventcomment.show', editStoryModal.root);
	            counterElm.html(parseInt(counterElm.html())+1);	            
	        }
	    },
	    deleteComment:function(comment_id){
	        post_path = "/rest/eventComment/delete";
	        eventComment.changeStatus(post_path,{"id":comment_id},"") 
	        eventComment.store["comment_num" + id] -= 1;
	        $(".msg_box", editStoryModal.root).find(".comment_num").text(eventComment.store["comment_num" + id]);
	        $("table.comment_"+comment_id,editStoryModal.root).remove();
	    },
	    displayComment:function(create_userId){
	        if(create_userId != profile_obj.id){
	            return "display:none";
	        }
	        if(create_userId == profile_obj.id){
	            return "display:";
	        }
	        
	    },
	    changeStatus: function(path, sendData, type) {    
	    	console.log(sendData);
	        $.ajax({
	            type: "POST",
	            contentType: "application/json; charset=UTF-8",
	            url: serverPath + path,
	            data: JSON.stringify(sendData),
	            dataType: "json",
	            xhrFields: {
	                withCredentials: true
	            },
	            success: function(data) {
	                if(type=="post_comment"){
	                    // Created Success
	                    if (data.status.code === "0000") {
	                        $(".wrapper .no_msg", editStoryModal.root).css("display", "none");
	                        $(".wrapper .post_comment", editStoryModal.root).empty();
	                        eventComment.dataObj.offset = 0;
	                        eventComment.store["comment_num" + id] += 1;
	                        $(".msg_box", editStoryModal.root).find(".comment_num").text(eventComment.store["comment_num" + id]);
	                        eventComment.clearTextarea($(".post_status .status_box textarea", editStoryModal.root));
	                        eventComment.requestComment(eventComment.dataObj, "/rest/eventComment/list")
	                    }
	                }

	            },
	            error: function(data) {
	                alert("Error");
	            }
	        });
	    }
}

/*******************************************************************************
Storybook List Modal Function
*******************************************************************************/
var storybookListModal = {
	delayTimer : 500,
	debug : false,
	standby : [],
	root : false,
	init : function(){
		this.root = $('#storybook-list-modal');
		storybookListModal.generate();
		storybookListModal.toHide();
		storybookListModal.resetValues();
		storybookListModal.bindFunctions();
		$(createStoryModal.root).after( $(storybookListModal.root) );
		console.log( "storybookListModal Initialized" );
	},
	toShow : function(){

		var drawSuccess = function(){
			if( $(lightboxModal.root).hasClass('show') ){
				$( storybookListModal.root ).addClass('sub');
			}
			screenLockScroll.enable();
			$('.content-list', storybookListModal.root).scrollTop(0);
			setTimeout(function(){
				$( storybookListModal.root ).addClass('show');
			}, storybookListModal.delayTimer / 10 );
			if( storybookListModal.debug) console.log( "storybookListModal Show" );
		}

		var dfd = $.Deferred();

		// Place your functions
		// Get Storybook List
		console.warn("Show some loading icons");
		var storybookRQ = new StorybookRQ(0),
			promisedBooks = storybookRQ.fire();
		promisedBooks.done(function(results){
			console.warn("Remove some loading icons");
			var storybookRS = new StorybookRS(results);
			if(storybookRS.IS_FAIL){
				storybookListModal.resetValues();
				storybookRS.onhold(storybookRQ);
			}
			else{
				storybookRS.drawDropdown( dfd );
				drawSuccess();
			}
		}).fail(function(errors){
			if( storybookListModal.debug) console.warn("Remove some loading icons");
			storybookListModal.resetValues();
			new FailRS(errors).onhold(storybookRQ);
		});
		storybookListModal.standby.push( dfd );
		return dfd;

	},
	toHide : function(){
		$( storybookListModal.root ).removeClass('show');
		if( !$(lightboxModal.root).hasClass('show') ){
			screenLockScroll.disable();
		}
		setTimeout(function(){
			$( storybookListModal.root ).removeClass('sub').removeAttr('class');
		}, storybookListModal.delayTimer );
		if( storybookListModal.debug) console.log( "storybookListModal Hide" );
	},
	resetValues : function(){
		console.trace();
		$(storybookListModal.standby).each(function(i,e){
			e.resolve(null);
		});
		storybookListModal.standby = [];
		if( storybookListModal.debug) console.log( "storybookListModal Reset Values" );
	},
	generate : function(){
		var wrapper = $("<div class='content-wrapper' />").appendTo( storybookListModal.root );
		var container = $("<div class='container' />").appendTo( wrapper );
		var header = $("<div class='header' />").appendTo( container );
		var titleCol = $("<p class='title-col' />").append('Select a recent storybook').appendTo( header );
		var buttonCol = $("<p class='button-col' />").append('<button class="ui-btn cancel">Cancel</button>').appendTo( header );
		var contentList = $("<div class='content-list' />").appendTo( container );
		var UL = $("<ul>").appendTo( contentList );
		var foot = $("<div class='footer' />").appendTo( container );
		if( storybookListModal.debug) console.log('storybookListModal Element Generated');
	},
	bindFunctions : function(dfd){

		// Hide Storybook List Modal
		$( storybookListModal.root ).on('click',function(e){
			if( !$(this).find('.container').hasClass('active') ){
				storybookListModal.resetValues();
				storybookListModal.toHide();
			}
			return false;
		});

		// Add class to Storybook list modal
		$('.container', storybookListModal.root).on('mouseenter',function(e){
			$(this).addClass('active');
			return false;
		}).on('mouseleave',function(e){
			$(this).removeClass('active');
			return false;
		});

		// Cancel
		$('.ui-btn.cancel', storybookListModal.root).on('click',function(e){
			storybookListModal.resetValues();
			storybookListModal.toHide();
			return false;
		});
		if( storybookListModal.debug) console.log( "storybookListModal Bind Function" );
	}
}





