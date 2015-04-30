// Development
include("./js/request/searchRQ.js");
include("./js/pojo/profile.js");
include("./js/pojo/event.js");
include("./js/request/friendRQ.js");
include("./js/request/storybookRQ.js");
include("./js/utils/contentUtils.js");

/*******************************************************************************
Initialize user header ui-buttons
*******************************************************************************/
var userHeader = {
	root : false, 
	init : function(){
		this.root = $('#user-header');
		var current_path = window.location.pathname.split('/').pop();
		$('.user-subnav li', userHeader.root).each(function(){
			if(current_path ==$(this).find("a").attr("href")){
				$(this).addClass("current");
			}
		});
		// console.log(current_path)
		
		var userProfile = profileAPI.getProfile();
		$('.user-subnav .profile-btn', userHeader.root).attr({
			'href' : "storyline.html"+'?data='+$.base64.encode("profileId="+userProfile.id),
			'title' : userProfile.getFullName()
		});

		if( userProfile.getPhoto() != null ){
			$('.user-subnav .user-picture SPAN', userHeader.root).css({
				'background-image' : 'url(' + userProfile.getPhoto() + ')'
			});
		}
		$('.user-subnav .user-name', userHeader.root).text( userProfile.getName() );
		console.log( 'userHeader - Collected puserProfile return in the following' );

		// Reset UI
		userHeader.reset();

		// Bind all UI 
		userHeader.bindUI();
		console.log( 'userHeader initialized' );
	},
	reset : function(){
		$('.ui-btn', userHeader.root).off('click');
		$('.searchField', userHeader.root).removeClass('active');
		$('.searchField INPUT', userHeader.root).off('focus blur').val('');
		console.log( 'userHeader reset' );
	},
	searchResShow : function(eventDrawn,peopleDrawn){
		var displayable = function(){
			setTimeout(function(){
				$('.spinner', userHeader.root).destroy();	
				$('.searchField', userHeader.root).removeClass('loading');
				$('.search-display', userHeader.root).addClass('show');
				$('.search-display .content', userHeader.root).scrollTop(0);
				console.log("Search Result Show");
			}, 300);
		}
		$.when( eventDrawn, peopleDrawn ).then( displayable );
	},
	searchResHide : function(){
		$('.search-display .content', userHeader.root).scrollTop(0);
		$('.search-display', userHeader.root).removeClass('show');
		$('.search-display .cat UL', userHeader.root).html('');
	},
	dialogPosted : function(ntype){

		var userProfile = profileAPI.getProfile();
		
		var redirectLink = 'storyline.html' +'?data='+$.base64.encode("profileId="+userProfile.id);

		switch(ntype) {
			case 'storybook':
				var entryTypeText = 'storybook';
				var entryPageText = 'storyline';
				break;
			case 'event':
				var entryTypeText = 'event';
				var entryPageText = 'agenda';
				redirectLink = 'agenda.html';
				break;
			default:
			var entryTypeText = 'story';
			var entryPageText = 'storyline';
		}

		var drawToHeader = function(ele,btn){
			$(ele).removeClass('hide');
			setTimeout(function(){
				$(ele).addClass('hide');
				setTimeout(function(){
					$(ele).remove();
				},500);
			},4000);
		}

		var dialog = $("<div />").addClass('dialog-posted hide');
		var grip = $("<div />").addClass('grip-control').appendTo( dialog );
		var link = $("<a />").attr({
			'class' : 'content',
			'href' : redirectLink
			// 'href' : '#'
		}).appendTo( grip );
		// .on('click',function(e){
		// 	return false;
		// });
		var text_1 = $('<span />').addClass('text').append('New ').appendTo( link );
		var entryType = $('<span />').addClass('entry-type').append( entryTypeText ).appendTo( link );
		var text_2 = $('<span />').addClass('text').append(' is posted on your ').appendTo( link );
		var entryPage = $('<span />').addClass('entry-page').append( entryPageText ).appendTo( link );
		$('.dialog-posted', userHeader.root).remove();
		$('HEADER', userHeader.root).prepend( dialog );
		setTimeout(function(){
			drawToHeader( dialog );
		},500);
	},
	bindUI : function(){
            
		// Initialize click event to all ui-button
		$('.ui-btn.settings', userHeader.root).on('click',function(e){
			alert( 'settings Button' + " clicked ");
			e.preventDefault();
		});

		$('.ui-btn.new-post', userHeader.root).on('click',function(e){
			lightboxModal.toShow();
			createStoryModal.toShow();
			console.log("new-post.click");

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
						
						$(".event-new-post .checkable-list", createStoryModal.root).html('');
						$(friends).each(function(i,e){
							// console.log( e );

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
								createStoryModal.participantsChecked();
								return false;
							});
							
							$(listItem).on('click',function(e){
								$(this).find('.ui-btn.checkbox').trigger('click');
							});

							$(".event-new-post .checkable-list", createStoryModal.root).append( listItem );
						});

					}
				}
			});

			storyUploader();
			e.preventDefault();
			// return false;
		});

		// Body Scrolling Disable
		$('.notification-dialog .dialog-wrapper', userHeader.root).on('mouseenter',function(){
			// function
		}).on('mouseleave',function(){
			// function
		});
                
                
 		// SearchField Input
		$('.searchField INPUT', userHeader.root).on('focus',function(e){
			$(this).closest('.searchField').addClass('active focus');
			return false;
		}).on('blur',function(e){
			if( $(this).val() == '' ){
				$(this).closest('.searchField').removeClass('active focus');
			}
			if( $(this).val() != '' ){
				$(this).closest('.searchField').removeClass('focus');
			}
			return false;
		});

		// Show More Event
		$('.ui-btn.show-more', userHeader.root).on('click',function(e){
			$(this).closest('.cat').find('LI').removeClass('hide');
			$(this).closest('.button-container').hide();
		});

		// Search display
		var countDownHide;
		$('.search-col', userHeader.root).on('mouseleave',function(e){
			countDownHide = setTimeout(function(){ 
				userHeader.searchResHide();
			},1500);
		}).on('mouseenter',function(e){
			clearTimeout(countDownHide);
		});
		$("BODY").on('click',function(event){
			if($(event.target).closest('.search-display', userHeader.root).length<1) { 
				userHeader.searchResHide();
			}
		});
		$('.display-wrapper', userHeader.root).on('scroll',function(e){
			var searchDisplay = $(this).closest('.search-display'), 
				parentTop = $(this).offset().top, 
				parentHeight = $(this).height(),
				childTop = $(this).find('.content').offset().top, 
				childBottom = childTop + $(this).find('.content').height() - parentTop - 2;
			if( childTop < parentTop ){
				$(searchDisplay).addClass('shadow-top shadow-bottom');
				if( childBottom <= parentHeight ){
					$(searchDisplay).removeClass('shadow-bottom');
				}
			}else{
				$(searchDisplay).removeClass('shadow-top');
			}
		});

		// SearchField Button
		$('.ui-btn.search', userHeader.root).on('click mousedown',function(e){
			var searchInput = $(this).closest('.searchField').find('INPUT');
			var searchField = $(this).closest('.searchField');
			var mouseAction = e.type;
			var noResultText = '<li class="item no-result"><div class="details"><p>No match(s) found</p></div></li>';
			userHeader.searchResHide();

			// console.log( mouseAction );

			switch( mouseAction ) {
				case 'mousedown':
				return false;
				break;
			default:
				if( $(searchInput).val() != '' ){
					// Backend Call Execute
					// $('.search-display', userHeader.root).show();
					// $(searchInput).focus();

					// Development Cas
					$('.searchField', userHeader.root).addClass('loading');
					$('.spinner', userHeader.root).sprite({fps: 16, no_of_frames: 8, start_at_frame: 0});
					// $('.search-display .cat UL', userHeader.root).html('');
					$('.cat.event .button-container', userHeader.root).hide();

					var fnProfileFail = function(e){
						console.groupCollapsed("Search User failed");
						console.warn(e);
						console.groupEnd();
					};
					var fnProfileAppend = function(profile){

						var item = $("<li />").attr({'class' : 'item' , 'data-id' : profile.id, 'data-url' : '#?id='+ profile.id});
						var photo = '<span></span>';
						var url = "storyline.html"+'?data='+$.base64.encode("profileId="+profile.id);
						if( profile.getPhoto() != null ){                                                  
							photo = '<span style="background-image: url(' + profile.getPhoto() + ');"></span>';
						}
						var userPicture = $("<a />").attr({'class':'user-picture','href':url}).append(photo).appendTo(item);
						var details = $("<div />").addClass('details').appendTo(item);
						var userName = $("<p />").addClass('user-name').html('<a href="' + url + '">' + profile.getName() + '</a>').appendTo( details );
						var extraInfo =  $("<p />").addClass('extra-info').text('Hong Kong').appendTo( details );

						if( profile.isFriend() ){
							// console.log( profile.showLevel );

							var showLevel = privacyTranslator( profile.showLevel );
							var friendGroup = $("<div />").addClass('friend-group-display').append('<span class="icon s20 green"></span>').appendTo( item );
							$(friendGroup).find('SPAN').addClass( showLevel );

						}else{

							if( !profile.isSentRQ() ){
								var addFriendBtn = $("<button />").addClass('ui-btn add-friend').html('<span class="icon s20 green addFriend"></span>').appendTo( item );
								
								// Bind function 
								$(addFriendBtn).on('click',function(e){
									var pFriendID = profile.id; // Friend PRofile ID
									// alert( profile.id );
									// Add Friends Request
									var friendRQ = new FriendRQ("addFriend", pFriendID, "GENERAL");
									friendRQ.fire().done(function(results){
										var friendRS = new FriendRS(results);
										if(friendRS.IS_FAIL){
											$(extraInfo).text( 'Fail' );
											friendRS.onhold(friendRQ);
										}
										else{
											friendRS.run(function(){
												$(extraInfo).text( 'Pending' );
												// $(this).remove();
												$(addFriendBtn).remove();
											});
										}
									}).fail(function(errors){
										$(extraInfo).text( 'Fail' );
										new FailRS(errors).onhold(friendRQ);
									});
								});

							}else{

								$(extraInfo).text( 'Pending' );

							}
							
						}

						// Push to Main-Search People List
						$('.cat.people UL', userHeader.root).append( item );
					};

					// Event
					var fnEventAppend = function(pEvent){
						// console.warn(pEvent);

						var item = $("<li />").attr({'class' : 'item' , 'data-id' : pEvent.id, 'data-url' : '#?id='+ pEvent.id});
						var getImage = '<span></span>';
						if( pEvent.getImage() != null ){
							getImage = '<span style="background-image: url(' + pEvent.getImage().url + ');"></span>';
						}
						var eventPicture = $("<div />").addClass('event-picture').append(getImage).appendTo( item );
						var details = $("<div />").addClass('details').appendTo( item );
						var title = $("<p />").addClass('title-of-event').text( pEvent.name ).appendTo( details );
						var date =  $("<p />").addClass('date-of-event').text(
							new Date(pEvent.begin).into('d MMM yyyy') + ' - ' + new Date(pEvent.end).into('d MMM yyyy') ).appendTo( details );
						var location =  $("<p />").addClass('location-of-event').text( pEvent.location ).appendTo( details );

						// Push to Main-Search Event List
						$('.cat.event UL', userHeader.root).append( item );
					};

					var eventDrawn = $.Deferred();
					// Event
					var searchEventRQ = new SearchRQ(Event, $('#mainSearch').val());
					searchEventRQ.fire().done(function(results){
						var searchRS = new SearchRS(Event, results, fnEventAppend);
						if(searchRS.IS_FAIL){
							searchRS.onhold(searchEventRQ);
						}
						else{
							searchRS.drawDropdown();
							eventDrawn.resolve();
						}

						// Show the Main-Search Result
						$('.cat.event .heading .number', userHeader.root).text( '(' + searchRS.size() + ')');
						$('.cat.event .item:not(.no-result):gt(2)', userHeader.root).addClass('hide');
						if( searchRS.size() > 3 ){
							$('.cat.event .button-container', userHeader.root).show();
						}
						if( searchRS.size() <= 0 ){
							$('.cat.event UL', userHeader.root).append( noResultText );
						}

					})
					.fail(function(errors){
						new FailRS(errors).onhold(searchEventRQ);
					});

					var peopleDrawn = $.Deferred();
					var searchProfileRQ = new SearchRQ(Profile, $('#mainSearch').val())
					searchProfileRQ.fire().done(function(results){
						var searchRS = new SearchRS(Profile, results, fnProfileAppend);
						if(searchRS.IS_FAIL){
							searchRS.onhold(searchProfileRQ);
						}
						else{
							searchRS.drawDropdown();
							peopleDrawn.resolve();
						}

						// Show the Main-Search Result
						$('.cat.people .heading .number', userHeader.root).text( '(' + searchRS.size() + ')');
						if( searchRS.size() <= 0 ){
							$('.cat.people UL', userHeader.root).append( noResultText );
						}

					}).fail(function(errors){
						new FailRS(errors).onhold(searchProfileRQ);
					});
					// Development Cas

					userHeader.searchResShow(eventDrawn.promise(),peopleDrawn.promise());

					$(searchInput).focus();

				}
				else{
					$(searchInput).focus();
				}
			}

			e.preventDefault();
			// return false;

		});

 		console.log( 'userHeader bind ui' );

	}
};
