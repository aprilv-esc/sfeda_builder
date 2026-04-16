	(function($) {
	    "use strict";

	    var header = $('.header'),
	        searchTrigger = jQuery('#search'),
	        searchBox = jQuery('.search-form'),
	        closeSearch = jQuery('#close'),
	        totop = $('a.scrolltop');

	    //onscroll header fix
	    jQuery(window).on('scroll', function() {
	        var scrolled = $(window).scrollTop();
	        if (scrolled > 120) {
	            header.addClass('fixed animated fadeInDown');
	        } else {
	            header.removeClass('fixed animated fadeInDown');
	        }

	    });

	    //Search triggers
	    searchTrigger.on('click', function(e) {
	        searchBox.toggleClass('shown');
	    });
	    //Search close trigger
	    closeSearch.on('click', function(e) {
	        searchBox.toggleClass('shown');
	    });

	    //scroll to top
	    totop.on('click', function(event) {
	        event.preventDefault();
	        $('html,body').animate({
	            scrollTop: $(this.hash).offset().top
	        }, 1500);
	    });

	    //animating progressbars
	    var $section = $('.progress-bars'),
	        progressBar = $(".progress-bar");

	    function loadDaBars() {
	        progressBar.each(function() {
	            var bar_width = $(this).attr('aria-valuenow');
	            $(this).width(bar_width + '%');
	        });
	    }
	    //Onscroll animate the bars
	    $(document).on('scroll', function(ev) {
	        var scrollOffset = $(document).scrollTop();
	        var containerOffset = $section.offset().top - window.innerHeight;
	        if (scrollOffset > containerOffset) {
	            setTimeout(function() {
	                loadDaBars();
	            }, 200);
	        }
	    });



	    // init Isotope
	    var $grid = $('#fitrows').isotope({
	        itemSelector: '.element-item',
	        layoutMode: 'fitRows',
	        getSortData: {
	            name: '.name',
	            category: '[data-category]',
	            weight: function(itemElem) {
	                var weight = $(itemElem).find('.weight').text();
	                return parseFloat(weight.replace(/[\(\)]/g, ''));
	            }
	        }

	    });

	    var $grid1 = $('#masonry').isotope({
	        itemSelector: '.element-item',
	        masonry: {},
	        getSortData: {
	            name: '.name',
	            category: '[data-category]',
	            weight: function(itemElem) {
	                var weight = $(itemElem).find('.weight').text();
	                return parseFloat(weight.replace(/[\(\)]/g, ''));
	            }
	        }
	    });

	    // filter functions
	    var filterFns = {
	        // show if number is greater than 50
	        numberGreaterThan50: function() {
	            var number = $(this).find('.number').text();
	            return parseInt(number, 10) > 50;
	        }, // show if name ends with -ium
	        ium: function() {
	            var name = $(this).find('.name').text();
	            return name.match(/ium$/);
	        }
	    };

	    // bind filter button click		
	    var filters = $('#filters');
	    filters.on('click', 'button', function() {
	        var filterValue = $(this).attr('data-filter');
	        // use filterFn if matches value
	        filterValue = filterFns[filterValue] || filterValue;
	        $grid1.isotope({
	            filter: filterValue
	        });
	    });
	    var triggerItems = $('.trigger-items');
	    triggerItems.each(function(i, buttonGroup) {
	        var $buttonGroup = $(buttonGroup);
	        $buttonGroup.on('click', 'button', function() {
	            $buttonGroup.find('.is-checked').removeClass('is-checked');
	            $(this).addClass('is-checked');
	        });
	    });

	    //just for portfolio link to project details, please remove when you add custom links to the View Details button
	    // jQuery('.portfolio-info').find('a.btn-color').attr('href', 'portfolio-details.html');

	    /** Mobile menu js **/
	    if (jQuery(window).width() < 768) {
	        var searchHtml = jQuery('<a href="javascript:void(0);" id="searchToggle" class="searchToggle"><span class="fa fa-search"></span></a>'),
	            submenuParent = jQuery("#topnav li > ul").parent().addClass("hasSubMenu");

	        searchHtml.insertAfter('.logo');
	        submenuParent.prepend('<div class="accordion-toggle"><i class="fa fa-angle-down"></i></div>');

	        jQuery('#searchToggle').on('click', function(e) {
	            searchBox.toggleClass('shown');
	        });

	        jQuery("#topnav li").each(function(index, element) {
	            jQuery(this).find('.accordion-toggle').on('click', function() {
	                jQuery(this).parent().find('> ul').slideToggle(200);
	                jQuery(this).find('.fa').toggleClass('rotate-me');
	                jQuery(this).parent().siblings().find('> ul').slideUp(200);
	                jQuery(this).parent().siblings().find('.fa').removeClass('rotate-me');
	            });
	        });
	    }
	})(jQuery);

	jQuery(document).on('ready', function() {
	    var testimonials = $('#testimonials'),
	        clients = $('#clients'),
	        clients_v2 = $('#clients-v2'),
	        portfolio = $('.portfolio-details-slider');

	    //testimonials slider
	    testimonials.owlCarousel({
	        items: 1,
	        nav: true,
	        navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>']
	    });

	    //clients slider
	    clients.owlCarousel({
	        items: 4,
	        margin: 18,
	        dots: true,
	        responsiveClass: true,
	        responsive: {
	            0: { items: 2 },
	            400: { items: 3 },
	            600: { items: 4 }
	        },
	    });

	    //clients version2 slider
	    clients_v2.owlCarousel({
	        items: 4,
	        margin: 18,
	        dots: false,
	        responsiveClass: true,
	        responsive: {
	            0: { items: 2 },
	            400: { items: 3 },
	            600: { items: 4 }
	        },
	        nav: true,
	        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
	    });

	    //portfolio slider
	    portfolio.owlCarousel({
	        items: 1,
	        margin: 0,
	        dots: false,
	        nav: true,
	        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
	    });
	});

	//Search function for mobiles
	jQuery(window).on("load resize", function(e) {
	    var searchMob = jQuery("#search"),
	        showcaseImg = jQuery(".showcase-img"),
	        blogSidebar = jQuery(".blogs-sidebar");
	    if (jQuery(window).width() < 768) {
	        showcaseImg.detach().insertBefore(".showcase-left");
	        blogSidebar.detach().insertAfter(".blogs-main");
	        searchMob.parent().hide();
	    }
	});

	//on Ready function
	$(document).on('ready', function() {
	    var bigimage = $("#big");
	    var thumbs = $("#thumbs");
	    var totalslides = 2;
	    var syncedSecondary = true;

	    bigimage.owlCarousel({
	        items: 1,
	        slideSpeed: 2000,
	        nav: true,
	        autoplay: true,
	        dots: false,
	        loop: true,
	        navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
	    }).on('changed.owl.carousel', syncPosition);

	    thumbs.on('initialized.owl.carousel', function() {
	            thumbs.find(".owl-item").eq(0).addClass("current");
	        })
	        .owlCarousel({
	            items: 8,
	            responsiveClass: true,
	            responsive: {
	                0: { items: 2 },
	                400: { items: 3 },
	                600: { items: 4 },
	                1000: { items: 6 },
	                1300: { items: 8 }
	            },
	            dots: true,
	            margin: 13,
	            nav: false,
	            loop: false,
	            smartSpeed: 200,
	            slideSpeed: 500,
	            slideBy: totalslides,
	            responsiveRefreshRate: 100
	        }).on('changed.owl.carousel', syncPosition2);

	    function syncPosition(el) {
	        //if loop is set to false, then you have to uncomment the next line
	        //var current = el.item.index;

	        //to disable loop, comment this block
	        var count = el.item.count - 1;
	        var current = Math.round(el.item.index - (el.item.count / 2) - 0.5);

	        if (current < 0) {
	            current = count;
	        }
	        if (current > count)  {
	            current = 0;
	        }
	        //to this
	        thumbs.find(".owl-item").removeClass("current").eq(current).addClass("current");
	        var onscreen = thumbs.find('.owl-item.active').length - 1;
	        var start = thumbs.find('.owl-item.active').first().index();
	        var end = thumbs.find('.owl-item.active').last().index();

	        if (current > end) {
	            thumbs.data('owl.carousel').to(current, 100, true);
	        }
	        if (current < start) {
	            thumbs.data('owl.carousel').to(current - onscreen, 100, true);
	        }
	    }

	    function syncPosition2(el) {
	        if (syncedSecondary) {
	            var number = el.item.index;
	            bigimage.data('owl.carousel').to(number, 100, true);
	        }
	    }

	    thumbs.on("click", ".owl-item", function(e) {
	        e.preventDefault();
	        var number = $(this).index();
	        bigimage.data('owl.carousel').to(number, 300, true);
	    });
	});

	wow = new WOW({
	    boxClass: 'wow',
	    animateClass: 'animated',
	    offset: 150,
	    mobile: false,
	});
	wow.init();
