$(document).ready(function() {
	$('.ui.search').search({
		apiSettings: {
			url: 'https://api.graphtv-dev.spectralcoding.com/search/{query}'
		},
		selectFirstResult: true,
		showNoResults: true,
		minCharacters: 3,
		type: 'shows',
		templates: {
			shows: function (response) {
				html = '';
				response.results.forEach(function(curShow) {
					if (curShow['r'] != -1) {
						rating = curShow['r'] + '/10';
					} else {
						rating = 'No Rating';
					}
					html += '<a class="result"><div class="content"><div class="title">' + curShow['t'] + '</div>' +
						'<div class="description ui three column grid">' +
						'<div class="column">' + curShow['y'] + '</div>' +
						'<div class="column">' + rating + '</div>' +
						'<div class="column">' + curShow['v'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' Votes</div>' +
						'</div></div></a>';
				});
				return html;
			}
		},
		onSelect: function (search_result, response) {
			console.log("On Select:")
			console.log(search_result);
			console.log(response);
			$('#search_row').transition({
				animation: 'fade out',
				onComplete: function() {
					$('#main_column').css("max-width", "1500px");
					$('#chart_row').html(
						'<div style="display:inline-block">' +
							'<h1 id="chart_show_name">' + search_result.t + '</h1>' +
							'<div>' +
								'<div style="float:left;">' +
									'<h2 class="chart_show_info" id="chart_show_year">' + search_result.y + '</h2>' +
								'</div>' +
								'<div style="float:right;">' +
									'<h2 class="chart_show_info" id="chart_show_rating">' + search_result.r + '/10 (' + search_result.v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' Votes)</h2>' +
								'</div>' +
								'<div style="float:clear;"></div>' +
							'</div>' +
						'</div>' +
						'<div id="highcharts" style="height:600px;"></div>'
					);
					show_chart(search_result);
					$('#chart_row').transition('fade in');
				}
			});
			/*
			$('#chart_show_name').html(result['t']);
			$('#search_row').transition({
				animation: 'fade out',
				onComplete: function() {
					// We want to eventually change the page URL and then go directly to the
					// graph when that page is pulled up. How to we serve the homepage
					// from any URL that doesn't have static content (such as images/js/css)?
					// Maybe we just have to do like https://hostname/?q=[id]
					// window.history.pushState("", "", '/' + result['i']);
					console.log("done!");
					$('#main_column').css("max-width", "1500px");
					$('#chart_row').transition('fade in');
				}
			});
			*/
		},
	});
	// Start temp code to auto-transition during debugging
	/*
	search_result = {
        'i': '3N6z',
        'r': 9.5,
        't': 'Breaking Bad',
        'v': 1049294,
        'y': '2008-2013'
    }
	$('#search_row').transition({
		animation: 'fade out',
		onComplete: function() {
			$('#main_column').css("max-width", "1500px");
			$('#chart_row').html('<h1 id="chart_show_name">Breaking Bad</h1>' +
				'<div id="highcharts" style="height:600px;"></div>');
			show_chart(search_result);
			$('#chart_row').transition('fade in');
		}
	});
	*/
	// End temp code
	function get_ratings(search_result) {
		//console.log('Search Result:');
		//console.log(search_result);
		$.ajax({
			url: 'https://api.graphtv-dev.spectralcoding.com/show/' + search_result['i'] + '/ratings',
			success: function(ratings_data) {
				// Radius for the episode with the most votes
				large_radius = 10;
				// Radius for the episode with the least votes
				small_radius = 3;
				// How many episodes before we reduce the radius size bt 25% (repeats)?
				radius_reducer = 200;
				// Radiuses could be smaller than small_radius due to radius_reducer... Absolute minimum?
				minimum_radius = 1;
				// Stack Exchange (CrossValidated): “Best” series of colors to use for differentiating series in publication-quality plots
				// https://stats.stackexchange.com/questions/118033/best-series-of-colors-to-use-for-differentiating-series-in-publication-quality
				// Recommends Cynthia Brewer's ColorBrewer2
				// http://colorbrewer2.org/#type=qualitative&scheme=Paired&n=10
				// I just swapped the light/dark versions so dark is first.
				// If there are more series than season_colors it will use season_colors_many
				// and then loop through them.
				season_colors = ['#1f78b4','#33a02c','#e31a1c','#ff7f00','#6a3d9a']
				// Lighter Immediately After
				//season_colors_many = ['#1f78b4','#a6cee3','#33a02c','#b2df8a','#e31a1c','#fb9a99','#ff7f00','#fdbf6f','#6a3d9a','#cab2d6'];
				// Lighter Offset By 1
				//season_colors_many = ['#1f78b4','#cab2d6','#33a02c','#a6cee3','#e31a1c','#b2df8a','#ff7f00','#fb9a99','#6a3d9a','#fdbf6f'];
				// Lighter Offset By 2
				//season_colors_many = ['#1f78b4','#fdbf6f','#33a02c','#cab2d6','#e31a1c','#a6cee3','#ff7f00','#b2df8a','#6a3d9a','#fb9a99'];
				// Same Colors Just Looped More
				season_colors_many = season_colors
				range_radius = large_radius - small_radius;
				//console.log('Ratings Data:');
				//console.log(ratings_data);
				ep_list = ratings_data.l
				point_count = 0
				series_obj = {}
				// Get the objects into an unordered object:
				// show_series[season][episode] = ratings
				least_votes = -1
				most_votes = -1
				Object.keys(ep_list).forEach(function(ep_id) {
					//console.log(ep_id, ep_list[ep_id]);
					ep_data = ep_list[ep_id];
					// If there is no rating then we don't chart it.
					if (ep_data.hasOwnProperty('r')) {
						if (!series_obj.hasOwnProperty(ep_data.s)) {
							series_obj[ep_data.s] = {}
						}
						series_obj[ep_data.s][ep_data.e] = ep_data;
						if (least_votes == -1 || least_votes > ep_data.v) { least_votes = ep_data.v }
						if (most_votes == -1 || most_votes < ep_data.v) { most_votes = ep_data.v }
						point_count++;
					}
				});
				gap_votes = most_votes - least_votes;
				console.log(least_votes + ' - ' + most_votes + ' (' + gap_votes + ')');
				//console.log(series_obj);
				// Create a list of seasons (we can't assume IMDB will have every season)
				seasons = []
				for (k in series_obj) {
					if (series_obj.hasOwnProperty(k)) {
						seasons.push(k);
					}
				}
				seasons.sort(function(a, b){return a-b});
				if (seasons.length > season_colors.length) {
					season_colors = season_colors_many;
				}
				//console.log(seasons);
				point_num = 0;
				data_by_ep_num = {}
				seasons.forEach(function(cur_season) {
					// Ordered Episodes for Season Data Points
					ordered_eps = []
					// XY Coordinate List for Linear Regression for Season Trend Line
					x_y_coords = []
					// Create a list of episodes (we can't assume IMDB will have every episode)
					episodes = []
					for (k in series_obj[cur_season]) {
						if (series_obj[cur_season].hasOwnProperty(k)) {
							episodes.push(k);
						}
					}
					episodes.sort(function(a, b){return a-b});
					episodes.forEach(function(cur_episode) {
						cur_ep_obj = series_obj[cur_season][cur_episode]
						x_y_coords.push([point_num, cur_ep_obj.r]);
						pct_size = (cur_ep_obj.v - least_votes) / gap_votes;
						// Get the default Marker Radius
						marker_radius = small_radius + (range_radius * pct_size)
						// Reduce the marker size based on the amount of episodes.
						// Value is the same as marker_radius if less than
						// radius_reducer shows
						marker_size_mult = Math.pow(0.9, Math.floor(point_count / radius_reducer));
						marker_radius = (marker_radius * marker_size_mult).toFixed(2);
						ordered_eps.push({
							x: point_num,
							y: cur_ep_obj.r,
							marker: { radius: Math.max(marker_radius, minimum_radius) }
						});
						data_by_ep_num[point_num] = series_obj[cur_season][cur_episode]
						point_num++;
					});
					// Add the point for the episode
					// Color here takes the zero-indexed season number and gets a color
					// based on the index (looping around the color list using modulo)
					window.chart.addSeries({
						data: ordered_eps,
						color: season_colors[(cur_season - 1) % season_colors.length]
					}, false);
					// Use linear regression to calculate (X1, Y1), (X2, Y2) points
					// for the season trend line
					start_x = x_y_coords[0][0];
					start_y = ss.linearRegressionLine(ss.linearRegression(x_y_coords))(start_x);
					end_x = x_y_coords[x_y_coords.length - 1][0];
					end_y = ss.linearRegressionLine(ss.linearRegression(x_y_coords))(end_x);
					// Add the season trend line
					window.chart.addSeries({
						type: 'line',
						data: [[start_x, start_y], [end_x, end_y]],
						color: season_colors[(cur_season - 1) % season_colors.length]
					}, false);
				});
				window.all_eps = data_by_ep_num;
				window.chart.redraw();
			},
			cache: false
		});
	}
	function show_chart(search_result) {
		window.chart = new Highcharts.Chart({
			chart: {
				renderTo: 'highcharts',
				events: {
					load: get_ratings(search_result)
				},
				type: 'scatter',
				zoomType: 'xy'
			},
			title: { text: '' },
			xAxis: {
				title: {
					enabled: true,
					text: 'Episode Number'
				},
				startOnTick: true,
				endOnTick: true,
				showLastLabel: true
			},
			yAxis: {
				title: {
					text: 'Episode Rating'
				}
			},
			legend: {
				enabled: false
			},
			plotOptions: {
				line: {
					marker: {
						enabled: false
					},
					states: {
						hover: {
							lineWidth: 0
						}
					},
					enableMouseTracking: false
				},
				scatter: {
					marker: {
						symbol: 'circle',
						states: {
							hover: {
								enabled: true,
								lineColor: 'rgb(100,100,100)'
							}
						}
					},
					states: {
						hover: {
							marker: {
								enabled: false
							}
						}
					},
				},
				series: {
					turboThreshold: 50000
				}
			},
			tooltip: {
				formatter: function() {
					show_obj = window.all_eps[this.x];
					season_str = ((show_obj.s < 10) ? '0' + show_obj.s : show_obj.s)
					episode_str = ((show_obj.e < 10) ? '0' + show_obj.e : show_obj.e)
					return '<b>S' + season_str + 'E' + episode_str + ': ' + show_obj.t + '</b><br />' +
					show_obj.r + ' - ' + show_obj.v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' Votes';
				}
			}
		});
	};
});
