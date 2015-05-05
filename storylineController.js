
$(window).on('load',function(e){
	$.when(profileAPI.ready).done(function(){
		storylineController.init();
		friendGroupModal.init();
	});
});

function getStoryIdFromURI(name,type) {
	if( $.url().param(name) ){
		var decodedURI = $.base64.decode($.url().param(name));
		var urlparamType = $.url("?"+decodedURI).param(type);
		return urlparamType;
	}else{
		console.log( 'decode fail' );
	}
}

/*******************************************************************************
Storyline Controller Function
*******************************************************************************/
var storylineController = {
	debug : false,
	root : false,
	controllerTop : 240,
	sidebarTop : -391,
	myID : null,
	userID : null,
	userProfile : null,
	userFriendlist : null,
	init : function(){
		this.root = $('#storyline-profile');
		this.getStoryBy.shift = 15;
		this.getStoryBy.until = new Date();
		this.getStoryBy.from = this.getStoryBy.until.shift(-this.getStoryBy.shift);

		storylineController.userID = profileAPI.getProfile().id;
		storylineController.myID = profileAPI.getProfile().id;
		
		if( storylineController.debug ) console.time('Storyline Controller Initialized');
		if( storylineController.debug ) console.log( storylineController.userID );

		storylineController.userDetect();
		storylineController.requestCalls();

		storylineController.resetUI();
		storylineController.scrollTracker();
		storylineController.bindUI();

		storylineController.endlessStories.tracker();

		storylineController.requestParticularStory();

		if( storylineController.debug ) console.log('Storyline Controller Ready');

	},
	userDetect : function(){
		var url_user_id = getStoryIdFromURI("data","profileId");// call the function 

		if( url_user_id == 'undefined' || url_user_id == null ){
			if( storylineController.debug ) console.warn('ID did not found in URL. Replaced with Your Profile ID instead');
			url_user_id = storylineController.userID;
		}

		if( url_user_id != storylineController.userID ){
			// Other ID
			storylineController.userID = url_user_id;
			$('.my-menu', storylineController.root).remove();
		}else{
			// My ID
			$('.others-menu', storylineController.root).remove();
		}
	},
	requestCalls : function(){
		var para = { 'profileId' : storylineController.userID };
		$.ajax({
			type: "POST",
			contentType: "application/json; charset=UTF-8",
			url: serverPath + '/rest/users/extendedProfile',
			data: JSON.stringify( para ),
			dataType: "json",
			xhrFields: {
				withCredentials: true
			},
			success: function(data) {
				// if( storylineController.debug ) console.log( data );
				if(data.status.code == "0000" && data.status.message == "success") {
					storylineController.userProfile = new Profile( data.messages[0].info.content );
					storylineController.profileData( storylineController.userProfile );
				}else{
					alert("Success with extendedProfile, but return Error");
				}
			},
			error: function(data) {
			    alert("Error extendedProfile");
			}
		});

		if( storylineController.debug ) console.warn('Storyline Controller RequestCalls');
	},
	getStoryBy : {
		shift : null,
		until : null,
		from : null,
		update : function(){
			var shiftIncreaseInDay = -7;
			storylineController.getStoryBy.shift = shiftIncreaseInDay;
			storylineController.getStoryBy.until = storylineController.getStoryBy.from.shiftMilSec(-1);
			storylineController.getStoryBy.from = storylineController.getStoryBy.from.shift(shiftIncreaseInDay);
			if( storylineController.debug ) {
				console.log( 'Shifted : ' + storylineController.getStoryBy.shift + ' Days' );
				console.log( 'Until Date : ' + storylineController.getStoryBy.until );
				console.log( 'From Date : ' + storylineController.getStoryBy.from );
			}
		}
	},
	requestParticularStory : function(){
		loadInProgress.enable();
		var para = {
			'profileId' : storylineController.userID,
			'from' : storylineController.getStoryBy.from.getTime(),
			'until' : storylineController.getStoryBy.until.getTime()
		};
		$.ajax({
			type: "POST",
			contentType: "application/json; charset=UTF-8",
			url: serverPath + '/rest/story/list',
			data: JSON.stringify( para ),
			dataType: "json",
			xhrFields: {
				withCredentials: true
			},
			success: function(data) {
				if(data.status.code == "0000" && data.status.message == "success") {
					switch_logToStory(data,'filter');
					storylineController.getStoryBy.update();
					storylineController.endlessStories.isEnable = true;
					if( storylineController.debug ) console.log( data );
				}else{
					alert("Success with ParticularStory, but return Error");
				}
			},
			error: function(data) {
			    alert("ParticularStory Error");
			}
		});

		if( storylineController.debug ) console.log( "Storyline Controller Requested Particular Storyline" );

	},
	endlessStories : {
		isEnable : false,
		offsetBottom : 1,
		tracker : function(){
			$(window).on('scroll',function(e){
				if(this.scrollDone) clearTimeout(this.scrollDone);
				if( storylineController.endlessStories.isEnable ) {
					this.scrollDone = setTimeout(function() {
						var tileStoryline = $('.storyline.tileStory');
						var	tileStorylineHeight = tileStoryline.height();
						var	tileStorylineBottom = tileStorylineHeight + tileStoryline.offset().top,
							tileStorylineBottom = tileStorylineBottom - storylineController.endlessStories.offsetBottom
						if( tileStorylineBottom <= getScrollBottom ){
							storylineController.requestParticularStory();
							storylineController.endlessStories.isEnable = false;
							if( storylineController.debug ) console.log("Endless Stories Request Sent");
						}	
					},500);
				}
			});
		}
	},
	scrollTracker : function(){
		$(window).on('scroll',function(e){
			if( getScrollTop > storylineController.controllerTop ){
				$(storylineController.root).addClass('sticky');
			}else{
				$(storylineController.root).removeClass('sticky');
			}
		});
	},
	addFriend : function(){
		var para = {
				'id' : storylineController.userID,
				'displayLevelEnum' : 'PUBLIC'
			};
		$.ajax({
			type: "POST",
			contentType: "application/json; charset=UTF-8",
			url: serverPath + '/rest/users/addFriend',
			data: JSON.stringify( para ),
			dataType: "json",
			xhrFields: {
				withCredentials: true
			},
			success: function(data) {
				// if( storylineController.debug ) console.log( data );
				if(data.status.code == "0000" && data.status.message == "success") {
					console.log( data );
					$('.ui-btn.cancel, .text.cancel', storylineController.root).show();
					$('.ui-btn.add-friend', storylineController.root).hide();
					// alert('Added Friend');
				}else{
					alert("Success with Error");
				}
			},
			error: function(data) {
			    alert("Call Error");
			}
		});
	},
	cancelFriend : function(){
		var para = {
				'id' : storylineController.userID
			};
		$.ajax({
			type: "POST",
			contentType: "application/json; charset=UTF-8",
			url: serverPath + '/rest/users/cancelRequest',
			data: JSON.stringify( para ),
			dataType: "json",
			xhrFields: {
				withCredentials: true
			},
			success: function(data) {
				// if( storylineController.debug ) console.log( data );
				if(data.status.code == "0000" && data.status.message == "success") {
					console.log( data );
					$('.ui-btn.cancel, .text.cancel', storylineController.root).hide();
					$('.ui-btn.add-friend', storylineController.root).show();
					// alert('Added Friend');
				}else{
					alert("Success with Error");
				}
			},
			error: function(data) {
			    alert("Call Error");
			}
		});
	},
	changefriendShowLevel : function(privacyLevel){
		var para = {
			'id' : storylineController.userID,
			'displayLevelEnum' : translateLevel( privacyLevel )
		};
		$.ajax({
			type: "POST",
			contentType: "application/json; charset=UTF-8",
			url: serverPath + '/rest/users/switchDisplayLevel',
			data: JSON.stringify( para ),
			dataType: "json",
			xhrFields: {
				withCredentials: true
			},
			success: function(data) {
				if(data.status.code == "0000" && data.status.message == "success") {
					console.log(data);
					console.log('Success change friend showLevel');
				}else{
					alert("Success with switchDisplayLevel, but return Error");
					return false;
				}
			},
			error: function(data) {
			    alert("Error switchDisplayLevel");
			}
		});

		if( storylineController.debug ) console.warn('Change friend showLevel');

	},
	profileData : function(pData){
		if( storylineController.debug ) console.log( pData );
		$('.profile-info .user-picture > SPAN', storylineController.root).css({
			'background-image' : 'url(' + pData.getPhoto() + ')'
		});
		$('.profile-info .user-name > SPAN', storylineController.root).text( pData.getName() );
		$('.others-menu .info a.friends', storylineController.root).each(function(i,e){
			$(this).attr('href',$(this).attr('href')+'?data='+$.base64.encode("profileId="+pData.id));
		});

		if( pData.isSentRQ() ){
			// Pending Friend
			$('.ui-btn.cancel, .text.cancel', storylineController.root).show();
			$('.ui-privacyField', storylineController.root).remove();
		}else{
			if( typeof pData.showLevel !== 'undefined' ){
				// Already Friend
				$('.ui-privacyField', storylineController.root).show();
				$('.ui-btn.add-friend', storylineController.root).remove();
				$('.ui-btn.cancel, .text.cancel', storylineController.root).remove();

				var privacyLevel = translatePrivacy( pData.showLevel );

				// Mod Privacy Level 
				var buttonText = $('.privacy-list .ui-btn:not(.privacy)[data-privacy="' +  privacyLevel + '"]', storylineController.root).find('.text').html();
				$('.privacy-list .ui-btn:not(.privacy)[data-privacy="' +  privacyLevel + '"]', storylineController.root).addClass('current').siblings().removeClass('current');
				$('.ui-privacyField', storylineController.root).attr('data-privacy', privacyLevel);
				$('.ui-privacyField > .ui-btn.privacy', storylineController.root).find('.text').html( buttonText );
				$('.ui-privacyField .privacy-list .ui-btn.privacy', storylineController.root).find('.text').html( buttonText );		

			}else{
				// Not Friend Yet
				$('.ui-btn.add-friend', storylineController.root).show();
				$('.ui-privacyField', storylineController.root).remove();
			}
		}

		if( storylineController.userID != storylineController.myID ){
			if( storylineController.debug ) console.log( 'Not Myself ');
			storylineController.getFFList();
		}

		$(storylineController.root).removeClass('hide');
		if( storylineController.debug ) console.timeEnd('Storyline Controller Initialized');
	},
	resetUI : function(){
		$('.ui-btn.privacy', storylineController.root).removeClass('current prev');
		$(storylineController.root).removeClass('friend-list-show').attr('data-privacy','myself');
		$('.view-controller', storylineController.root).attr('data-privacy','myself');
		$('.ui-btn.privacy.myself', storylineController.root).addClass('current');
		$(storylineController.root).next('#story-container').find('.sidebar').css({'top':storylineController.sidebarTop}); 
	},
	getFFList : function(){
		// Retrieve friend’s profile
		if( storylineController.debug ) console.log( "My ID : " + storylineController.userID );
		var para = { 'profileId':storylineController.userID };

		$.ajax({
			type: "POST",
			contentType: "application/json; charset=UTF-8",
			url: serverPath + '/rest/users/profileFriends',
			data: JSON.stringify( para ),
			dataType: "json",
			xhrFields: {
				withCredentials: true
			},
			success: function(data) {
				if(data.status.code == "0000" && data.status.message == "success") {
					var ffCount = data.messages.length;
					$('.others-menu .info a.friends .num', storylineController.root).text( ffCount + ' ');
				}else{
					alert("Success with profileFriends, but return Error");
				}
			},
			error: function(data) {
			    alert("Error profileFriends");
			}
		});

		if( storylineController.debug ) console.warn('Storyline Controller Get Friend Friend List');
	},
	drawMyFriendList : function( privacyLevel ){

		// Get Friends List
		var friendRQ = new FriendRQ("friends", null, null);
		console.log(friendRQ);
		var promisedFrdRQ = friendRQ.fire();
		var fnFail = function(e){
			console.groupCollapsed("friends failed");
			console.warn(e);
			console.groupEnd();
		};
		promisedFrdRQ.fail(fnFail)
		.done(function(results){
			if(results == null || results.status == null || results.status.code != 0000){
				fnFail(results);
			}
			else{
				console.log("friends done");
				var friendRS = new FriendRS(results);
				if(friendRS.IS_FAIL){
					friendRS.onhold(friendRQ);
				}
				else{

					// console.log(friendRS.parseFriendList());
					var friends = friendRS.parseFriendList();
				
					// Controller View
					// Count Friends
					var friendsCount = 0;
					var friendGroup = [];
					var noFriendText = 'currently no friend in this group';

					switch(privacyLevel) {
						case 'public':
						friendGroup.push('public','friends','closeFriends');
						break;
						case 'friends':
						friendGroup.push('friends','closeFriends');
						break;
						default:
						friendGroup.push('closeFriends');
					}


					// **************** Friend List Starts **************** //
					$(friendGroup).each(function(i,e){
						var privacyLevel = e;

						$(friends).each(function(i,e){

							if( privacyLevel == translatePrivacy(e.showLevel) ){
								
								if( friendsCount < 16 ){
									var listItem = $('<li />');
									var userPicture = $('<a />').attr({
										'href': 'storyline.html?data=' + $.base64.encode("profileId=" + e.id),
										'title': e.getFullName(),
										'class':'user-picture'
									});

									if( e.getPhoto() == null || e.getPhoto() == 'undefined'){
										var picture = $('<span></span>');
									}else{
										var picture = $('<span style="background-image: url(' + e.getPhoto() + ');"></span>');
									}

									$(picture).appendTo( userPicture );
									$(userPicture).appendTo( listItem );

									$(".friend-list UL", storylineController.root).append( listItem );
								}

								friendsCount++;
							}

							if( storylineController.debug ) console.warn( friendsCount );

						});

					});

					// Fill Empty List
					if( friendsCount < 1 ){
						var listItem = $('<li />').addClass('empty-item').append( noFriendText );
						$(".friend-list UL", storylineController.root).append( listItem );
					}
	
					// And More Button Dependency 
					if( friendsCount >= 16 ) { // 16 Max
						$(".ui-btn.and-more", storylineController.root).show();
					}
					// **************** Friend List Ends **************** //




					// **************** FriendGroup Modal View Starts **************** //
					// Create Group Wrapper
					$(friendGroup).each(function(i,e){
						var groupType = e;
						var headingTitle;
						switch(e) {
							case 'public':
							headingTitle = 'Public';
							break;
							case 'friends':
							headingTitle = 'Friends';
							break;
							default:
							headingTitle = 'Close friends';
						}

						var group = $('<div />').attr({
							'class' : 'group clearFix',
							'data-privacy' : groupType
						});
						var heading = $('<p  />').attr({
							'class' : 'heading'
						}).text( headingTitle ).appendTo( group );
						var list = $('<ul class="clearFix" />').appendTo( group );

						$(group).appendTo('.display-content', friendGroupModal.root);

					});

					// Loop via friends list response
					$(friends).each(function(i,e){

						var listItem = $('<li />');
						// var link = $('<a />').attr({'href':'#?' + e.id});
						var link = $('<a />').attr({
							'title' : e.getFullName(),
							'href':'storyline.html?data=' + $.base64.encode("profileId=" + e.id) 
						});
						var picture = $('<span />').attr({
							'class' : 'user-picture',
							}).append('<span style="background-image: url(' + e.getPhoto() + ');"></span>');
						var name = $('<span class="user-name">' + e.getName() + '</span>');

						$(picture).appendTo( link );
						$(name).appendTo( link );
						$(link).appendTo( listItem );

						$('.group[data-privacy="' + translatePrivacy(e.showLevel) + '"] UL', friendGroupModal.root).append( listItem );

					});

					// Get total num after each loop
					var friendList = $('.group[data-privacy] UL', friendGroupModal.root);
					$(friendList).each(function(i,e){
						// if( storylineController.debug ) console.log( e );
						var fdCount = $(this).find('li').length;
						if( fdCount < 1 ){
							var listItem = $('<li />').addClass('empty-item');
							var text = $('<span class="text">' + noFriendText + '</span>').appendTo( listItem );
							$(this).append( listItem );
						}
					});
					// **************** FriendGroup Modal View Ends **************** //

				}
			}
		});

		if( storylineController.debug ) console.log( "Draw friend list" );

	},
	applyFiltering : function(){
		if( $(storylineController.root).length > 0 && storylineController.userID == storylineController.myID ){
			$('.storyline .story').each(function(i,e){
				var privacy_type = $(this).find('[data-menu-type="privacy"]').attr('data-privacy');
				$(this).attr('data-privacy',privacy_type);
			});
		}
	},
	bindUI : function(){

		// Privacy Button Filtering
		$(".ui-btn.filter", storylineController.root).on('click',function(e){
			var privacyLevel = $(this).attr('data-privacy');

			$(".friend-list UL", storylineController.root).empty();
			$('.display-content', friendGroupModal.root).empty();

			$(".ui-btn.and-more", storylineController.root).hide();

			$(this).removeClass('current prev').siblings('.ui-btn.filter').removeClass('current prev');
			$(this).addClass('current').prevAll().addClass('prev');
			$(this).closest('.view-controller').attr('data-privacy', privacyLevel);
			
			$(storylineController.root).attr('data-privacy', privacyLevel);
			if( privacyLevel != 'myself' ){
				storylineController.drawMyFriendList( privacyLevel );
				$(storylineController.root).addClass('friend-list-show');
			}else{
				$(storylineController.root).removeClass('friend-list-show');
			}

			sidebarCalendar.sidebarTrack();
		});

		// Show All Friend in overlay modal
		$(".ui-btn.and-more", storylineController.root).on('click',function(e){
			e.preventDefault();
			lightboxModal.toShow();
			friendGroupModal.toShow();
			// alert('Show more friends');
		});

		// Profile Info
		$(".profile-info", storylineController.root).on('click',function(e){
			e.preventDefault();
			window.location.href = $(this).attr('data-url')+'?data='+$.base64.encode("profileId="+storylineController.userID);
		});

		// Cancel Friend Request Button
		$(".ui-btn.cancel", storylineController.root).on('click',function(e){
			e.preventDefault();
			storylineController.cancelFriend();
			// alert('Cancel Friend request');
		});

		// Add Friend Button
		$(".ui-btn.add-friend", storylineController.root).on('click',function(e){
			e.preventDefault();
			storylineController.addFriend();
			// alert('Add Friend');
		});

		// UI-Privacy Field
		$('.ui-privacyField.default > .ui-btn.privacy', storylineController.root).on('click',function(e){
			var thisField = $(this).closest('.ui-privacyField');
			var thisPrivacyList = $('.privacy-list', thisField);
			var removeList = function(){
				$(thisPrivacyList).removeClass('show').find('.ui-btn').off('click');
				$(thisField).off('mouseleave');
			}

			$(thisPrivacyList).addClass('show');
			$(thisField).on('mouseleave',function(e){
				removeList();
			});

			$('.ui-btn:not(.privacy)', thisPrivacyList).on('click',function(e){
				var privacy_type = $(this).attr('data-privacy');
				var content = $(this).find('.text').text();

				storylineController.changefriendShowLevel( privacy_type );

				// Changes Text and Attributes
				$('.ui-btn.privacy', thisField).find('.icon:not(.arrow-down)').removeClass('public friends closeFriends myself').addClass(privacy_type);
				$('.ui-btn.privacy', thisField).attr('data-privacy',privacy_type).find('.text').text( content );
				$(thisField).attr('data-privacy',privacy_type);

				$(this).addClass('current').siblings().removeClass('current');
				removeList();

				if( storylineController.debug ) console.log( privacy_type );
			});
		});

	}
}


/*******************************************************************************
Friend Group List Modal Function
*******************************************************************************/
var friendGroupModal = {
	debug : false,
	delayTimer : 500,
	root : false,
	toShow : function(){
		$( friendGroupModal.root ).addClass('show');
		if( friendGroupModal.debug ) console.log( "Friend Group List Modal Show" );
	},
	toHide : function(){
		$( friendGroupModal.root ).removeClass('show');
		setTimeout(function(){
			friendGroupModal.resetValues();
		}, friendGroupModal.delayTimer + 100 );
		if( friendGroupModal.debug ) console.log( "Friend Group List Modal Hide" );
	},
	resetValues : function(){
		$('.display-content', friendGroupModal.root).scrollTop(0);
		if( friendGroupModal.debug ) console.log( "Friend Group List Modal Reset" );
	},
	init : function(){
		friendGroupModal.generate();
		friendGroupModal.resetValues();
		friendGroupModal.bindFunctions();
		if( friendGroupModal.debug ) console.log( "Friend Group List Modal Initialized" );
	},
	generate : function(){
		var modal = $('<div id="friend-group-modal" />');
		$('#page-view').after( modal );

		this.root = $('#friend-group-modal');

		var wrapper = $('<div />').addClass('content-wrapper');
		var container = $('<div />').addClass('container').appendTo( wrapper );
		var subjectContainer = $('<div />').addClass('subject-container').appendTo( container );
		var subject =  $('<p />').addClass('subject').append('Friend Groups').appendTo( subjectContainer );
		var closeBtn =  $('<button />').addClass('ui-btn close').append('Close').appendTo( subjectContainer );
		var displayContent = $('<div />').addClass('display-content clearFix').appendTo( container );
		var footer = $('<div />').addClass('footer').appendTo( container );
		$(friendGroupModal.root).append( wrapper );

		if( friendGroupModal.debug ) console.log( "Friend Group List Modal generated" );
	},
	bindFunctions : function(){

		// Hide Modal
		$( friendGroupModal.root ).on('click',function(e){
			if( !$(this).find('.container').hasClass('active') ){
				lightboxModal.toHide();
				friendGroupModal.toHide();
			}
		});

		// Add class to Friend Group list modal
		$('.container', friendGroupModal.root).on('mouseenter',function(e){
			$(this).addClass('active');
			return false;
		}).on('mouseleave',function(e){
			$(this).removeClass('active');
			return false;
		});

		// Close
		$('.ui-btn.close', friendGroupModal.root).on('click',function(e){
			lightboxModal.toHide();
			friendGroupModal.toHide();
			return false;
		});

		if( friendGroupModal.debug ) console.log( "storybookListModal Bind Function" );

	}

}
