include("./js/api/profileAPI.js");
function drawNewsfeed(result){
	console.groupCollapsed("drawNewsfeed");
	// to objects
	var posts = [];
	var postElems = [];
	var messages = result.messages;
	$(messages).each(function(i,message){
		var post = null;
		var postElem = null;
		var detail = message.info.content.detail;
		if( message.info.content.type == 'STORY' ){
			post = new Story(detail);
			post.setDrawers({
				audio: drawVoiceStory,
				photo: drawPhotoStory,
				status: drawStatusStory,
				url: drawWebsiteStory
			});
			postElem = post.draw(post);
		}
		else if( message.info.content.type == 'EVENT' ){
			post = new Event(detail);
			postElem = drawEvent(post);
		}
		else if( message.info.content.type == 'STORYBOOK' ){
			post = new Storybook(detail);
			postElem = drawStorybook(post);
		}

		if(post != null && postElem != null){
			console.log(post);
			posts.push(post);
			postElems.push(postElem);
		}
	});
	console.groupEnd();
	return postElems;
}

function privacyTranslator(level){
	switch( level ) {
		case "PRIVATE":			
		level = 'myself';
		break;
		case "SOCIAL":
		level = 'friends';
		break;
		case "CLOSE":
		level = 'closeFriends';
		break;	
		default:
		level = 'public';
	}
	return level;
}

function requireSocial(pPost){
	// Social Status
	var socicalStatus = {
		like : ( pPost.isLikedByMe() ) ? 'social-liked' : 'social-like',
		dislike : ( pPost.isDislikedByMe() ) ? 'social-disliked' : 'social-dislike',
		support : ( pPost.isSupportedByMe() ) ? 'social-supported' : 'social-support'
	}

	var social = $("<div />").addClass('social');
	var likeBtn = $("<button />").attr({
		'class' : 'ui-btn like',
		'data-like-btn-id' : pPost.id
	}).append('<SPAN class="icon s16 white ' + socicalStatus.like + '"></SPAN><SPAN class="number">' + pPost.likeCount + '</SPAN>').appendTo( social );
	var dislikeBtn = $("<button />").attr({
		'class' : 'ui-btn dislike',
		'data-dislike-btn-id' : pPost.id
	}).append('<SPAN class="icon s16 white ' + socicalStatus.dislike + '"></SPAN><SPAN class="number">' + pPost.dislikeCount + '</SPAN>').appendTo( social );
	var supportBtn = $("<button />").attr({
		'class' : 'ui-btn support',
		'data-support-btn-id' : pPost.id
	}).append('<SPAN class="icon s16 white ' + socicalStatus.support + '"></SPAN><SPAN class="number">' + pPost.supportCount + '</SPAN>').appendTo( social );
	var commentBtn = $("<button />").attr({
		'class' : 'ui-btn comment',
		'data-comment-btn-id' : pPost.id
	}).append('<SPAN class="icon s16 white ' + 'social-comment' + '"></SPAN><SPAN class="number">' + pPost.commentCount + '</SPAN>').appendTo( social );

	return social;
}

function requireMenu(pAuthorId,postType,displayLevel){
	var menu = $("<div />").addClass('menu');
	var postType_text = 'story';
	var buttons = '';
	if( postType == 'storybook' ){ postType_text = 'storybook'; }

	if( profileAPI.getProfile().id == pAuthorId ){
		buttons += '<button class="ui-btn edit" data-menu-type="edit"><span class="icon s16 white grid-edit"></span></button>';
		buttons += '<button class="ui-btn privacy" data-menu-type="privacy" data-privacy="public"><span class="icon s16 white public"></span><span class="icon s16 white friends"></span><span class="icon s16 white closeFriends"></span><span class="icon s16 white myself"></span></button>';
	}else{
		if( displayLevel == 'public' ){
			buttons += '<button class="ui-btn share" data-share="' + postType_text + '"><span class="icon s16 white grid-share"></span></button>';
		}
		buttons += '<button class="ui-btn menu" data-menu-type="menu"><span class="icon s16 white grid-menu"></span></button>';
	}

	$(menu).append( buttons );
	return menu;	
}

function requireProfile(pStory,pAuthor){
	var owner = (typeof pStory !== 'undefined' && typeof pStory.sharedStory !== 'undefined')? new Profile(pStory.sharedStory.profile): null;
	// console.warn(owner);
	var div = '<DIV class="profile">';
		if( pAuthor.getPhoto() != null ){
			div += '<a href="storyline.html?data=' + $.base64.encode("profileId=" + pAuthor.id) + '" class="user-picture"><span style="background-image: url(' + pAuthor.getPhoto() + ');"></span></a>';
		}else{
			div += '<a href="storyline.html?data=' + $.base64.encode("profileId=" + pAuthor.id) + '" class="user-picture"><span></span></a>';
		}
		if( owner  === null ){
			div += '<a href="storyline.html?data=' + $.base64.encode("profileId=" + pAuthor.id) + '" class="user-name">' + pAuthor.getName() + '</a>';
		}else{
			div += '<a href="storyline.html?data=' + $.base64.encode("profileId=" + pAuthor.id) + '" class="user-name">' + pAuthor.getName() + ' Shares ' + owner.getName() +  '</a>';
		}
		div += '</DIV>';
	return div;
}

function requireTimeLocation(pPost){
	var ivDate = dateAPI.from(pPost.createdDate);
	pPost.location = "Hong Kong";
	return '<DIV class="data">'
		+	'<p class="time-location">'
		+	'<span class="full-date">' + ivDate.into('d MMM yyyy') + '</span>'
		+	'<span class="time">' + ivDate.into('h:mm n')  + '</span>'
		+	'<span class="location">in ' + pPost.location + '</span>'
		+	'</p>'
		+ '</DIV>';
}

function reqireMenuWidget(pAuthorId,postType,pPost){
	var menuWidget = $('<div />').addClass('menu-widget');
	var postType_text = 'story';
	if( postType == 'storybook' ){ postType_text = 'storybook'; }

	var containers = '';
	if( profileAPI.getProfile().id != pAuthorId ){
		containers += '<ul class="button-container menu">';
		containers += '<li><button class="ui-btn report" data-report-btn-id="'+pPost.id+'" data-story-type="'+postType_text+'">Report ' + postType_text + '</button></li>';
		containers += '</ul>';
	}else{
		containers += '<ul class="button-container edit">';
		containers += '<li>';
		if( postType != 'storybook' ){
			containers += '<a class="storyEditFrame" href="story_edit_dialog.html?data='+$.base64.encode('id='+pPost.id)+'"></a>';
		}
		containers += '<button class="ui-btn edit-story" data-edit-btn-id="'+pPost.id+'" data-story-type="'+postType_text+'">Edit ' + postType_text + '</button>';
		containers += '</li>';
		if( postType !== 'storybook' && pPost.getSubtype() !== 'url' ){
			containers += '<li><button class="ui-btn add-to-story">Put into storybook</button></li>';
		}
		containers += '<li><button class="ui-btn delete-story" data-delete-btn-id="'+pPost.id+'" data-story-type="'+postType_text+'">Delete ' + postType_text + '</button></li>';
		containers += '</ul>';
		containers += '<ul class="button-container privacy">';
		containers += '<li><button class="ui-btn" data-privacy="public">Public<span class="icon s20 c-999 public"></span><span class="icon s20 green public"></span><span class="icon s12 green ui-tick"></span></button></li>';
		containers += '<li><button class="ui-btn" data-privacy="friends">Friends<span class="icon s20 c-999 friends"></span><span class="icon s20 green friends"></span><span class="icon s12 green ui-tick"></span></button></li>';
		containers += '<li><button class="ui-btn" data-privacy="closeFriends">Close friends<span class="icon s20 c-999 closeFriends"></span><span class="icon s20 green closeFriends"></span><span class="icon s12 green ui-tick"></span></button></li>';
		containers += '<li><button class="ui-btn" data-privacy="myself">Myself<span class="icon s20 c-999 myself"></span><span class="icon s20 green myself"></span><span class="icon s12 green ui-tick"></span></button></li>';
		containers += '</ul>';
	}
	$(menuWidget).append( containers );
	return menuWidget;
}

// Photo
function drawPhotoStory(pStory){
	// If not lanscape, add portrait class
	// If landcape, add landscape class
	// If no Preview, add no-text class
	// If no Preview, skip the text-preview
	// If no Preview, skip the text 
	
	/********* Global Starts *********/
	// Author Data
	var author = new Profile(pStory.profile);

	/********* Global Ends ********/

	// Dependency 
	// Create Story
	var story = $("<DIV />");
	$(story).attr({
		'data-story-id' : pStory.id,
		'class' : 'story photo ' + (pStory.getPhoto().isLandscape? 'landscape': 'portrait'),
		'data-story-type' : "story", 
		'data-utc-time-created' : pStory['createdDate'],
		'data-utc-time-begin' : pStory['begin'], 
		'data-utc-time-end' : pStory['end']
	});
	if( StringUtils.isEmpty(pStory.content) ){
		$(story).addClass('no-text');
	}else{
		$(story).removeClass('no-text');
	}

	// Display Level
	var displayLevel = privacyTranslator( pStory.displayLevel );

	// Require Menu
	var menu = requireMenu(author.id,'story',displayLevel);
	$(menu).appendTo( story );

	// Require Menu Widget
	var menuWidget = reqireMenuWidget(author.id,'story', pStory);
	$(menuWidget).appendTo( story );

	// Selected the Privacy Level Button
	$(menu).find('.ui-btn.privacy').attr('data-privacy', displayLevel );
	$(menuWidget).find('[data-privacy="' + displayLevel + '"]').closest('LI').addClass('selected').siblings().removeClass('selected');
        
	// Text aand Preview
	if( StringUtils.isNotEmpty(pStory.content) ){
		if( pStory.getPhoto().isLandscape ){
			var preview = '<p class="text-preview"><span class="trim wb">' + trim_MaxLength(pStory.content,106,103) + '</span></p>';
			var text = '<a class="text"><span><span class="trim wb">' + trim_MaxLength(pStory.content,106,103) + '</span></span></a>';
		}else{
			var preview = '<p class="text-preview"><span class="trim wb">' + trim_MaxLength(pStory.content,268,265) + '</span></p>';
			var text = '<a class="text"><span><span class="trim wb">' + trim_MaxLength(pStory.content,268,265)  + '</span></span></a>';
		}
		$(preview).appendTo( story );
		$(text).appendTo( story );
		$(story).find('a.text').addClass('storyDetailsFrame').attr('href', 'story_detail_dialog.html?data=' + $.base64.encode('type=story&&id='+pStory.id) );
	}
					
	// Create Photo
	var photo = '<a class="photo"><span class="para lazy" data-original="' + pStory.getPhoto().url + '"></span></a>';
	$(photo).appendTo( story );
	$(story).find('a.photo').addClass('storyDetailsFrame').attr('href', 'story_detail_dialog.html?data=' + $.base64.encode('type=story&&id='+pStory.id) );

	// Create Meta
	var meta = $("<DIV />").addClass('meta').appendTo( story );

	// Require Profile
	var profile = requireProfile(pStory, author);
	
	// Require Time & Location
	var timeLocation = requireTimeLocation( pStory );
	
	// Require Social
	var social = requireSocial(pStory);
	
	$(profile).appendTo( meta );
	$(timeLocation).appendTo( meta );
	$(social).appendTo( meta );

	return story;

}

// Voice 
function drawVoiceStory(pStory){
	// If no Preview, add no-text class
	// If no Preview, skip the text-preview 
	/********* Global Starts *********/
	// Author Data
	var author =  new Profile(pStory.profile);
	/********* Global Ends ********/

	// Create Story
	var story = $("<DIV />");
	$(story).attr({
		'data-story-id' : pStory.id,
		'class' : 'story voice ',
		'data-story-type' : "story", 
		'data-utc-time-created' : pStory['createdDate'],
		'data-utc-time-begin' : pStory['begin'], 
		'data-utc-time-end' : pStory['end']
	});
	if( StringUtils.isNotEmpty(pStory.content) ){
		$(story).removeClass('no-text');
	}else{
		$(story).addClass('no-text');
	}

	// Display Level
	var displayLevel = privacyTranslator( pStory.displayLevel );

	// Require Menu
	var menu = requireMenu(author.id,'story',displayLevel);
	$(menu).appendTo( story );

	// Require Menu Widget
	var menuWidget = reqireMenuWidget(author.id,'story', pStory);
	$(menuWidget).appendTo( story );

	// Selected the Privacy Level Button
	$(menu).find('.ui-btn.privacy').attr('data-privacy', displayLevel );
	$(menuWidget).find('[data-privacy="' + displayLevel + '"]').closest('LI').addClass('selected').siblings().removeClass('selected');

	// Text aand Preview
	if( StringUtils.isNotEmpty(pStory.content) ){
		var preview = '<p class="text-preview"><span class="trim wb">' + trim_MaxLength(pStory.content,128,125) + '</span></p>';
		$(preview).appendTo( story );
	}

	// Content Audio, Source and Button
	var content = $("<DIV />").addClass('content').appendTo( story );
	var audio = $("<AUDIO />").attr({'preload' : 'metadata', 'autobuffer' : true, 'controls' : true}).appendTo( content );
	var source = $("<SOURCE />").attr({'src' : pStory.mediaUrl, 'type' : 'audio/mpeg'}).appendTo( audio );
	$(audio).append('Your browser does not support the audio element.');
	var button = $("<BUTTON />").addClass('ui-btn stage default').appendTo( content );
	$(button).html('<span class="icon s48 white grid-voice-default"></span><span class="icon s48 white grid-voice-playing"></span><span class="icon s48 white grid-voice-stop"></span>');
	$(content).append('<p class="length"></p>');

	// Create Meta
	var meta = $("<DIV />").addClass('meta').appendTo( story );

	// Require Profile
	var profile = requireProfile(pStory, author);
	
	// Require Time & Location
	var timeLocation = requireTimeLocation( pStory );
	
	// Require Social
	var social = requireSocial(pStory);
	
	$(profile).appendTo( meta );
	$(timeLocation).appendTo( meta );
	$(social).appendTo( meta );

	return story;
}

// Status
function drawStatusStory(pStory){

	/********* Global Starts *********/
	// Author Data
	var author =  new Profile(pStory.profile);

	/********* Global Ends ********/

	// Create Story
	var story = $("<DIV />");
	$(story).attr({
		'data-story-id' : pStory.id,
		'class' : 'story status',
		'data-story-type' : "story", 
		'data-utc-time-created' : pStory['createdDate'],
		'data-utc-time-begin' : pStory['begin'], 
		'data-utc-time-end' : pStory['end']
	});

	// Display Level
	var displayLevel = privacyTranslator( pStory.displayLevel );

	// Require Menu
	var menu = requireMenu(author.id,'story',displayLevel);
	$(menu).appendTo( story );

	// Require Menu Widget
	var menuWidget = reqireMenuWidget(author.id,'story', pStory);
	$(menuWidget).appendTo( story );

	// Selected the Privacy Level Button
	$(menu).find('.ui-btn.privacy').attr('data-privacy', displayLevel );
	$(menuWidget).find('[data-privacy="' + displayLevel + '"]').closest('LI').addClass('selected').siblings().removeClass('selected');

	// Text aand Preview
	var text = '<a class="text"><span><span class="trim wb">' + trim_MaxLength(pStory.content,106,103) + '</span></span></a>';
	$(text).appendTo( story );
	$(story).find('a.text').addClass('storyDetailsFrame').attr('href', 'story_detail_dialog.html?data=' + $.base64.encode('id='+pStory.id+"&&type=story") );

	// Create Meta
	var meta = $("<DIV />").addClass('meta').appendTo( story );

	// Require Profile
	var profile = requireProfile(pStory, author);
	
	// Require Time & Location
	var timeLocation = requireTimeLocation( pStory );
	
	// Require Social
	var social = requireSocial(pStory);
	
	$(profile).appendTo( meta );
	$(timeLocation).appendTo( meta );
	$(social).appendTo( meta );

	return story;
}


// Status
function drawWebsiteStory(pStory){
	/********* Global Starts *********/
	// Author Data
	var author =  new Profile(pStory.profile);

	// Photo Data
	var photoUrl = null;
	if( pStory.getPhoto() !== null ){
		photoUrl = pStory.getPhoto().url;
	}
	/********* Global Ends ********/

	// Create Story
	var story = $("<DIV />");
	$(story).attr({
		'data-story-id' : pStory.id,
		'class' : 'story website',
		'data-story-type' : "story", 
		'data-utc-time-created' : pStory['createdDate'],
		'data-utc-time-begin' : pStory['begin'], 
		'data-utc-time-end' : pStory['end']
	});

	// Display Level
	var displayLevel = privacyTranslator( pStory.displayLevel );

	// Require Menu
	var menu = requireMenu(author.id,'story',displayLevel);
	$(menu).appendTo( story );

	// Require Menu Widget
	var menuWidget = reqireMenuWidget(author.id,'story', pStory);
	$(menuWidget).appendTo( story );

	// Selected the Privacy Level Button
	$(menu).find('.ui-btn.privacy').attr('data-privacy', displayLevel );
	$(menuWidget).find('[data-privacy="' + displayLevel + '"]').closest('LI').addClass('selected').siblings().removeClass('selected');

	// Text
	var urlDetails = $('<a />').addClass('text').append('<span></span>').appendTo( story );
	var urlTitle = $('<span />').addClass('trim wb').append( trim_MaxLength(pStory.title,86,83) );
	var urlLink = $('<span />').addClass('url').append( pStory.summary );
	$(urlDetails).find('> SPAN').append( urlTitle, urlLink );

	// Photo
	if( photoUrl !== null ){
		var photo = $('<a />').addClass('photo').append('<span class="para lazy" data-original="' + photoUrl + '"></span>');
		$(photo).appendTo( story );
	}else{
		$(story).addClass('no-photo');
	}

	// Hidden Link
	var urlInvisible = $('<a />').attr({
		'class' : 'invisible storyDetailsFrame',
		'href' : 'story_detail_dialog.html?data=' + $.base64.encode('id='+pStory.id+"&&type=story") 
	}).appendTo( story );

	// Text Extra
	var textExtra = $('<a />').addClass('text extra').append('<span></span>').appendTo( story );
	var trimText = '<span class="trim wb">' + trim_MaxLength(pStory.content,86,83) + '</span>';
	var urlText = '<span class="url">' + pStory.mediaUrl + '</span>';
	var readMoreBTN = $('<button />').addClass('ui-btn readmore').append('Read more');
	$(textExtra).find('> SPAN').append( trimText, urlText, readMoreBTN );

	$(story).find('a.text, a.photo, a.text.extra').attr({
		'href' : pStory.mediaUrl,
		'target' : '_blank'
	});

	// Create Meta
	var meta = $("<DIV />").addClass('meta').appendTo( story );

	// Require Profile
	var profile = requireProfile(pStory, author);
	
	// Require Time & Location
	var timeLocation = requireTimeLocation( pStory );
	
	// Require Social
	var social = requireSocial(pStory);
	
	$(profile).appendTo( meta );
	$(timeLocation).appendTo( meta );
	$(social).appendTo( meta );

	return story;
}


// Event
function drawEvent(pEvent){
	// Time
	var eventBegin = dateAPI.from(pEvent.begin);
	var eventEnd = dateAPI.from(pEvent.end);

	// ********** Notifier Starts ********** //
	// if I dont own this event and was invited
	var admin = new Profile(pEvent.profile);
	if( admin.id != profileAPI.getProfile().id && CollectionUtils.isNotEmpty(pEvent.invitors) ){
		var notification = "Invited by : " + new Profile(pEvent.invitors[0]).getFullName();
	}
	// ok, just show who owns this event
	else{
		var notification = "Organized by : " + admin.getFullName();
	}
	// ********** Notifier Ends ********** //

	// Create Story
	var eventElem = $("<DIV />");
	$(eventElem).attr({
		'data-event-id' : pEvent.id,
		'class' : 'story event',
		'data-story-type' : "event", 
		'data-utc-time-created' : pEvent['createdDate'],
		'data-utc-time-begin' : pEvent['begin'],
		'data-utc-time-end' : pEvent['end'],
		'data-event' : 'public'
	});

	if( pEvent.getImage() != null ){
		$(eventElem).removeClass('no-photo');
	}else{
		$(eventElem).addClass('no-photo');
	}

	// Event Information
	var infoContainer = $("<DIV />").addClass('info-container');
	var info = $("<TABLE />").addClass('info').append( infoContainer );
	$(info).append('<TBODY></TOBDY>');
	for (var i = 0; i < 3; i++) { 
    	$("<TR />").appendTo( info );
	}

	$(infoContainer).appendTo( eventElem );
	$(info).appendTo( infoContainer );

	var dateOfEvent_td = $("<TD />").addClass('date-of-event');
	var locationOfEvent_td = $("<TD />").addClass('location-of-event');
	var participants_td = $("<TD />").addClass('joined');
	var desOfEvent_td = $("<TD />").attr('colspan', 2).addClass('des-of-event');

	$(infoContainer).find('TR:eq(0)').append( dateOfEvent_td );
	$(infoContainer).find('TR:eq(0)').append( locationOfEvent_td );
	$(infoContainer).find('TR:eq(1)').append( participants_td );
	$(infoContainer).find('TR:eq(2)').append( desOfEvent_td );

	var storyBook_btn = $("<BUTTON />").addClass('ui-btn event-storybook');
	$(storyBook_btn).html('<span class="icon s16 white grid-eventStorybook"></span>Event storybook<span class="icon s12 white ui-arrow-right"></span>');

	$(participants_td).after('<TD />');
	$(participants_td).next('TD').append( storyBook_btn );

	var dateBox = '<DIV class="box">';
		dateBox += '<span><span class="icon s16 white grid-dateTime"></span></span>';
		dateBox += '<span><span class="date">Somday Dummy Date</span><br>Somday Dummy Time</span>';
		dateBox += '</DIV>';
	$(dateBox).appendTo( dateOfEvent_td );

	var locationBox = '<DIV class="box">';
		locationBox += '<span><span class="icon s16 white grid-location"></span></span>';
		locationBox += '<span class="wb">Somday Dummy Location</span>';
		locationBox += '</DIV>';
	$(locationBox).appendTo( locationOfEvent_td );

	var participantsWrapper = $("<DIV />").addClass('picture-wrapper');
	$(participantsWrapper).append('<div class="total-joined"><span class="icon s16 white grid-participants"></span><span class="number">Count</span></div>');
	$(participantsWrapper).append('<span class="icon s12 white ui-arrow-right"></span>');
	$(participantsWrapper).appendTo( participants_td );

	var eventDes = '<span class="trim wb">Somday Dummy Content</span>';
	$(eventDes).appendTo( desOfEvent_td );

	// Photo
	var photo = $("<DIV />").addClass('photo');
	if( pEvent.getImage() != null ){
		$(photo).append('<span class="para lazy" data-original="' + pEvent.getImage().url + '"></span>');
	}else{
		$(photo).append('<div class="event"><p class="date-of-event">30<br>Oct</p></div>');
	}
	$(photo).appendTo( eventElem );

	// Meta
	var meta = $("<DIV />").addClass('meta');
	var organizer = $("<TABLE />").addClass('organizer').append('<TBODY><TR></TR></TBODY>');
	$(organizer).appendTo( meta );
	$(meta).appendTo( eventElem );

	// Join Event Button
	var joinEvent_btn = $("<BUTTON />").addClass('ui-btn join-event' + (pEvent.isJoined()?' joined':''));
	$(joinEvent_btn).append('<span class="icon s24 white grid-joined-event"></span><span class="icon s24 white grid-join-event"></span>');

	var org_dataOfEvent_td = $("<td />").addClass('date-of-event');
	$(org_dataOfEvent_td).append('<span class="date">20</span><br><span class="month">Feb</span>');

	var org_info_td = $("<td />").addClass('info');
	$(org_info_td).append('<p class="title-of-event">Robocop Movie</p>');
	$(org_info_td).append('<p class="organizer-of-event">Invited by : Somday</p>');

	var org_joinTheEvent_td = $("<td />").addClass('join-the-event');
	$(org_joinTheEvent_td).append( joinEvent_btn );

	$(organizer).find("TR").append( org_dataOfEvent_td );
	$(organizer).find("TR").append( org_info_td );
	$(organizer).find("TR").append( org_joinTheEvent_td );

	//********** Data Filling **********//
	$(dateOfEvent_td).find('.box > SPAN:eq(1)').html(
		'<span class="date">' + eventBegin.into('d MMM') + '</span><br>' + 
		eventBegin.into('h:mm n') + ' - ' + eventEnd.into('h:mm n'));
	$(locationOfEvent_td).find('.box > SPAN:eq(1)').text( trim_MaxLength(pEvent.location,63,60) );
	$(participants_td).find('.total-joined .number').text( pEvent.counts.join );
	$(desOfEvent_td).find('.trim').text( trim_MaxLength(pEvent.description,183,180) );
	$(photo).find('.date-of-event').html( eventBegin.into('d') + '<BR>' + eventBegin.into('MMM'));
	$(meta).find('.date-of-event .date').text( eventBegin.into('d') );
	$(meta).find('.date-of-event .month').text( eventBegin.into('MMM') );
	$(meta).find('.title-of-event').text( pEvent.name );
	$(meta).find('.organizer-of-event').text( notification );
	// if( pEvent.getImage() != null ){
	// 	$(photo).find('> SPAN').addClass('para').css('background-image', 'url(' + pEvent.getImage().url +')' );
	// }
	
	// Put Participants Profile Photo Max 3 Limited
	// Memeber
	var participantProfiles = [];
	var participants = pEvent.participants;
	if( CollectionUtils.isNotEmpty(participants)){
		$(participants).each(function(i,e){
			if( e.status == 'JOIN' ){
				participantProfiles.push(new Profile(e.profile));
			}
		});
	}
	$(participantProfiles).each(function(i,e){
		if( i < 3 ){
			var userPicture = '<span class="user-picture"><span style="background-image: url('+ e.getPhoto() +');"></span></span>'
			$(participantsWrapper).append( userPicture );
		}
	});

	return eventElem;
}

// STorybook
function drawStorybook(pStorybook){
	/********* Global Starts *********/
	var bookBegin = dateAPI.from(pStorybook.begin);
	var bookEnd = dateAPI.from(pStorybook.end);
	/********* Global Ends ********/

	// Locations
	// var storybook_location = pStorybook.location; // Dependency

	// Content 

	// Author Data
	var author = new Profile(pStorybook.profile);
	var bookBlocks = [];

	var coverDraw = function(){

		// Cover Main
		var coverMain = $('<div />').addClass('item cover main');

		// Display Level
		var displayLevel = privacyTranslator( pStorybook.displayLevel );

		// Require Menu
		var menu = requireMenu(author.id,'storybook',displayLevel);
		$(menu).appendTo( coverMain );

		// Change Privacy Button Icon
		$(menu).find('.ui-btn.privacy').attr('data-privacy', displayLevel );

		var info = $("<div />").addClass('info').appendTo( coverMain );
		var trim = $('<div />').addClass('trim wb').appendTo( info );
		var title = $("<p />").addClass('title').appendTo( trim );
		var date = $("<p />").addClass('data').appendTo( trim );
		var begin = $("<span />").addClass('since');
		var end = $("<span />").addClass('to');
		$(date).append( begin).append(' to <br>').append( end );

		var social = $("<div />").addClass('social').appendTo( coverMain );
		var likeBtn = $("<button />").addClass('ui-btn like').append('<span class="icon s16 social-like"></span><span class="number">' + '426'  +'</span>');
		$(likeBtn).appendTo( social );

		//********** Data Filling **********//
		$(title).append( trim_MaxLength(pStorybook.name,24,21) );
		$(begin).append( bookBegin.into('d MMM yyyy') );
		$(end).append( bookEnd.into('d MMM yyyy') );

		bookBlocks.push( coverMain );

		// Cover Sub
		var coverSub = $("<div />").addClass('item cover sub');
		var meta = $("<div />").addClass('meta').appendTo( coverSub );
		var userPicture = $("<a />").attr({'class' : 'user-picture', 'href' : 'storyline.html?data=' + $.base64.encode("profileId=" + author.id) });
		$(userPicture).append('<span style="background-image: url(' + author.getPhoto() + ');"></span></a>').appendTo( meta );
		var userName = $("<a />").attr({'class' : 'user-name', 'href' : 'storyline.html?data=' + $.base64.encode("profileId=" + author.id) }).appendTo( meta );

		//********** Data Filling **********//
		$(userName).append( author.getName() );

		bookBlocks.push( coverSub );

	}

	var drawBookStory = function(pStory){
		var ivStoryAuthor = new Profile(pStory.profile);

		// Social Status
		var socicalStatus = {
			like : ( pStory.isLikedByMe() ) ? 'social-liked' : 'social-like',
			dislike : ( pStory.isDislikedByMe() ) ? 'social-disliked' : 'social-dislike',
			support : ( pStory.isSupportedByMe() ) ? 'social-supported' : 'social-support'
		};

		// Display Level
		var displayLevel = privacyTranslator( pStory.displayLevel );

		switch( pStory.getSubtype() ) {

			case "audio":

				// Create Voice
				var item = $("<div />").attr({'class' : 'item voice', 'data-story-id' : pStory.id});
				if( displayLevel == 'public' ){
					var menu = $("<div />").addClass('menu').appendTo( item );
					var shareBtn = $("<button />").attr({'class' : 'ui-btn share', 'data-share' : 'story'});
					$(shareBtn).append('<span class="icon s16 white grid-share"></span>').appendTo( menu );
				}

				// Content Audio, Source and Button
				var content = $("<DIV />").addClass('content').appendTo( item );
				var audio = $("<AUDIO />").attr({'preload' : 'metadata', 'autobuffer' : true, 'controls' : true}).appendTo( content );
				var source = $("<SOURCE />").attr({'src' : pStory.mediaUrl, 'type' : 'audio/mpeg'}).appendTo( audio );
				$(audio).append('Your browser does not support the audio element.');
				var button = $("<BUTTON />").addClass('ui-btn stage default').appendTo( content );
				$(button).html('<span class="icon s48 white grid-voice-default"></span><span class="icon s48 white grid-voice-playing"></span><span class="icon s48 white grid-voice-stop"></span>');
				$(content).append('<p class="length"></p>');

				// Create Meta
				var meta = $("<div />").addClass('meta').appendTo( item );
				var userName = $("<a />").attr({'class' : 'user-name', 'href' : 'storyline.html?data=' + $.base64.encode("profileId=" + ivStoryAuthor.id) }).append( ivStoryAuthor.getName() ).appendTo( meta );
				var likeBtn = $("<button />").addClass('ui-btn like').attr('data-like-btn-id', pStory.id ).append('<span class="icon s16 ' + socicalStatus.like + '"></span><span class="number">' + pStory.likeCount  +'</span>').appendTo( meta );

				bookBlocks.push( item );

				break;

			case "photo":
				var ivPhoto= pStory.getPhoto();

				// Create Voice
				var item = $("<div />").attr({'class' : 'item photo ' + ((ivPhoto.isLandscape) ? 'landscape' : 'portrait'), 'data-story-id' : pStory.id});
				if( displayLevel == 'public' ){
					var menu = $("<div />").addClass('menu').appendTo( item );
					var shareBtn = $("<button />").attr({'class' : 'ui-btn share', 'data-share' : 'story'});
					$(shareBtn).append('<span class="icon s16 white grid-share"></span>').appendTo( menu );
				}

				// Create Photo
				var photo = $("<a />").addClass('photo').append('<span class="para lazy" data-original="' + ivPhoto.url + '"></a>').appendTo( item );
				$(item).find('a.photo').addClass('storyDetailsFrame').attr('href', 'story_detail_dialog.html?data=' + $.base64.encode('id='+pStory.id+"&&type=story"));

				// Create Meta
				var meta = $("<div />").addClass('meta').appendTo( item );
				var userName = $("<a />").attr({'class' : 'user-name', 'href' : 'storyline.html?data=' + $.base64.encode("profileId=" + ivStoryAuthor.id) }).append( ivStoryAuthor.getName() ).appendTo( meta );
				var likeBtn = $("<button />").addClass('ui-btn like').attr('data-like-btn-id', pStory.id ).append('<span class="icon s16 ' + socicalStatus.like + '"></span><span class="number">' + pStory.likeCount  +'</span>').appendTo( meta );

				bookBlocks.push( item );

				break;

			case "status":

				// Create Status
				var item = $("<div />").attr({'class' : 'item status', 'data-story-id' : pStory.id});
				if( displayLevel == 'public' ){
					var menu = $("<div />").addClass('menu').appendTo( item );
					var shareBtn = $("<button />").attr({'class' : 'ui-btn share', 'data-share' : 'story'});
					$(shareBtn).append('<span class="icon s16 white grid-share"></span>').appendTo( menu );
				}

				// Text
				var text = $("<a />").addClass('text').append('<span><span class="trim wb">' + trim_MaxLength(pStory.content,58,53) + '</span></span>').appendTo( item );
				$(item).find('a.text').addClass('storyDetailsFrame').attr('href', 'story_detail_dialog.html?data=' + $.base64.encode('id='+pStory.id+"&&type=story") );

				// Create Meta
				var meta = $("<div />").addClass('meta').appendTo( item );
				var userName = $("<a />").attr({'class' : 'user-name', 'href' : 'storyline.html?data=' + $.base64.encode("profileId=" + ivStoryAuthor.id) }).append( ivStoryAuthor.getName() ).appendTo( meta );
				var likeBtn = $("<button />").addClass('ui-btn like').attr('data-like-btn-id', pStory.id ).append('<span class="icon s16 ' + socicalStatus.like + '"></span><span class="number">' + pStory.likeCount  +'</span>').appendTo( meta );

				bookBlocks.push( item );

				break;
				
			default:
			// console.log( obj );
		}
	};

	// Push Covers Items
	coverDraw();

	// Push Story Items
	$(pStorybook.storys).each(function(i,e){
		drawBookStory(new Story(e));
	});


	var storybookElem = $("<DIV />");
	$(storybookElem).attr({
		'data-storybook-id' : pStorybook.id,
		'class' : 'story storybook',
		'data-story-type' : "storybook", 
		'data-utc-time-created' : pStorybook['createdDate'],
		'data-utc-time-begin' : pStorybook['begin'], 
		'data-utc-time-end' : pStorybook['end']
	});

	// Require Menu Widget
	var menuWidget = reqireMenuWidget(author.id,'storybook', pStorybook);
	$(menuWidget).appendTo( storybookElem );

	// Selected the Privacy Level Button
	$(menuWidget).find('[data-privacy="' + privacyTranslator( pStorybook.displayLevel ) + '"]').closest('LI').addClass('selected').siblings().removeClass('selected');

	// Create Content Wrapper
	var contentWrapper = $("<div />").addClass('content-wrapper');
	$(contentWrapper).appendTo( storybookElem );

	// Create Content
	var content = $("<div />").addClass('content bb-bookblock');
	$(content).appendTo( contentWrapper );

	// Create Control
	var control = $("<div />").addClass('control');
	$(control).appendTo( contentWrapper );
	var controlBtn = '<button class="bb-nav-first">First page</button>';
		// controlBtn += '<!-- <button class="bb-nav-prev">Previous</button>';
		// controlBtn += '<button class="bb-nav-next">Next</button> -->';
		controlBtn += '<button class="bb-nav-prev"><span class="icon s12 white ui-arrow-left"></span></button>';
		controlBtn += '<button class="bb-nav-next"><span class="icon s12 white ui-arrow-right"></span></button>';
		controlBtn += '<button class="bb-nav-last">Last page</button>';
	$(controlBtn).appendTo( control );

	//********** Insert Storybook Items **********//
	$(bookBlocks).each(function(i,e){
		$(e).appendTo( content );
	});

	//********** Wrapping Items **********//
	var wrapItems = function(element){
		var root = $(element),
			count = $(root).find(' > .item').length, 
			flipPanel = Math.floor( count / 2 ), 
			flipBox = Math.floor( flipPanel / 2 );

		for(var x=0; x<=flipPanel; x++){
			$(root).find(' > .item:lt(2)').wrapAll('<div class="page-panel"></div>');
		}
		for(var x=0; x<=flipBox; x++){
			$(root).find(' > .page-panel:lt(2)').wrapAll('<div class="flip-box bb-item"></div>');
		}
		$(root).find('.flip-box.bb-item:first-child .page-panel:first-child').addClass('cover');
	}
	wrapItems( content );

	return storybookElem;
}

function storySocialUpdates(pPost){
	var id = pPost.id;
	$('[data-like-btn-id="'  + id + '"]').find('number').text( pPost.likeCount );
	$('[data-dislike-btn-id="'  + id + '"]').find('number').text( pPost.dislikeCount );
	$('[data-support-btn-id="'  + id + '"]').find('number').text( pPost.supportCount );
	$('[data-comment-btn-id="'  + id + '"]').find('number').text( pPost.commentCount );
}
