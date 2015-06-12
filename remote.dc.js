remote_dc = {
    // attributes
    crossfilterBaseUrl : "",
    updateDataBaseUrl : "",
    filters : d3.map(),
    customFilters : d3.map(),
    customGroups : d3.map(),
    customDimensions : d3.map(),
    customPages : d3.map(),
    serverData : {
        groups : {},
        dimensions : {},
        pages : {},
        state : {}
    },

    // methods
    onPreUpdate : null,
    onPostUpdate : null,
    onCommunicationError : null,

    groupData: _groupServerData,
    pageData: _pageServerData,
    dimensionData: _dimensionServerData,
    stateData: _stateServerData,

    makeRemote : _makeRemote,

    proxyDimension : _proxyDimension,
    proxyGroup : _proxyGroup,
    proxyPage : _proxyPage,

    setCustomFilter : _setCustomFilter,
    resetCustomFilter : _resetCustomFilter,
    getCustomFilter : _getCustomFilter,

    registerCustomGroup : _registerCustomGroup,
    registerCustomDimension : _registerCustomDimension,
    registerCustomPage : _registerCustomPage,

    unregisterCustomGroup : _unregisterCustomGroup,
    unregisterCustomDimension : _unregisterCustomDimension,
    unregisterCustomPage : _unregisterCustomPage,

    reset: _reset,
    resetAll : _resetAll,
    resetGroup : _resetGroup,

    renderGroup : _remoteRenderGroup,
    redrawGroup : _remoteRedrawGroup,
    renderAll : _remoteRenderAll,
    redrawAll : _remoteRedrawAll,
    render : _remoteRender,
    redraw : _remoteRedraw,

    remoteDataUpdate : _remoteDataUpdate,
    remoteDimensionsUpdate : _remoteDimensionsUpdate,
    remoteGroupsUpdate : _remoteGroupsUpdate,
    remotePagesUpdate : _remotePagesUpdate
};

function _makeRemote(chart, remoteConfig) {
    var _dimension = null;
    var _group = null;
    var _page = null;

    var _pageData = null;

    chart.remoteChart = true;

    chart.remoteDimension = function(_) {
        if (!arguments.length) return _dimension;
        _dimension = _;
        if ( _dimension && _dimension.name ) {
            this.dimension( _proxyDimension( _dimension ) );
        }
        return chart;
    };

    chart.remoteGroup = function(_) {
        if (!arguments.length) return _group;
        _group = _;
        if ( _group && _group.name ) {
            this.group( _proxyGroup( _group ) );
        }
        return chart;
    };

    chart.remotePage = function(_) {
        if (!arguments.length) return _page;
        _page = _;
        if ( _page && _page.name ) {
            this.pageData( _proxyPage( _page ) );
        }
        return chart;
    };

    chart.hasRemoteDimension = function() {
        return this.dimension() && this.dimension().name();
    };

    chart.hasRemoteGroup = function() {
        return this.group() && this.group().name();
    };

    chart.hasRemotePage = function() {
        return this.pageData() && this.pageData().name();
    };

    chart.pageData = function(_) {
        if (!arguments.length) return _pageData;
        _pageData = _;
        return chart;
    };

    // overriten from dc.js
    chart.filterHandler(function(dimension, filters) {
        _setChartFilter(chart, filters); // TODO cache
    });

    chart.redrawGroup = function() {
        _remoteRedrawGroup(this.chartGroup());
    };

    var _replace = remoteConfig['replace'];
    if (_replace) {
        for (method in _replace) {
            if (chart[method]) {
                chart[method](_replace[method]);
            }
        }
    }
    // overriten from dc.js

    chart.remoteDimension( remoteConfig['dimension'] || {} );
    chart.remoteGroup( remoteConfig['group'] || {} );
    chart.remotePage( remoteConfig['page'] || {} );
}

function _proxyDimension(remoteDimension) {
    return {
        name: function() {
            return remoteDimension['name'] || null;
        },
        config: function() {
            return _parseConfig(remoteDimension['config'] || {});
        },
        filter : function(v) { 
            // do nothing
        },
        filterFunction : function(f) { 
            // do nothing
        },
        filterRange : function(r) { 
            // do nothing
        },
        filterExact : function(v) { 
            // do nothing
        },
        filterAll : function() { 
            // do nothing
        },
        top : function() {
            return _dimensionServerData(this.name(), "top", []);
        },
        update : function(callback) {
            _remoteDimensionsUpdate(this.markToUpdate({}), callback);
        },
        updateSettings : function() {
            return this.config();
        },
        markToUpdate : function(updateSettings) {
            updateSettings[this.name()] = this.updateSettings();
            return updateSettings;
        }
    }
}

function _proxyGroup(remoteGroup) {
    return {
        name: function() {
            return remoteGroup['name'] || null;
        },
        config: function() {
            return _parseConfig(remoteGroup['config'] || {});
        },
        all : function() {
            return _groupServerData(this.name(), "all", []);
        },
        value : function() {
            return _groupServerData(this.name(), "value", []);
        },
        top : function(k) {
            return _groupServerData(this.name(), "top", []).slice(0, k);
        },
        update : function(callback) {
            _remoteGroupsUpdate(this.markToUpdate({}), callback);
        },
        updateSettings : function() {
            return this.config();
        },
        markToUpdate : function(updateSettings) {
            updateSettings[this.name()] = this.updateSettings();
            return updateSettings;
        }
    };
}

function _proxyPage(remotePage) {
    return {
        name: function() {
            return remotePage['name'] || null;
        },
        dimensionName: function() {
            return remotePage['dimension'] || null;
        },
        dimensionOrder: function() {
            return remotePage['dimensionOrder'] || null;
        },
        groupName: function() {
            return remotePage['group'] || null;
        },
        config: function() {
            return _parseConfig(remotePage['config'] || {});
        },
        items: function() {
            return _pageServerData(this.name(), "items", []);
        },
        totalSize: function() {
            return _pageServerData(this.name(), "totalSize", 0);
        },
        update : function(callback) {
            _remotePagesUpdate(this.markToUpdate({}), callback);
        },
        updateSettings : function() {
            return {
                dimension : this.dimensionName(),
                dimensionOrder : this.dimensionOrder(),
                group : this.groupName(),
                page : this.config()
            }
        },
        markToUpdate : function(updateSettings) {
            updateSettings[this.name()] = this.updateSettings();
            return updateSettings;
        }
    };
}

function _registerCustomGroup(remoteGroup) {
    remote_dc.customGroups.set(remoteGroup.name(), remoteGroup);
}

function _registerCustomDimension(remoteDimension) {
    remote_dc.customDimensions.set(remoteDimension.name(), remoteDimension);
}

function _registerCustomPage(remotePage) {
    remote_dc.customPages.set(remotePage.name(), remotePage);
}

function _unregisterCustomGroup(name) {
    remote_dc.customGroups.remove(name);
}

function _unregisterCustomDimension(name) {
    remote_dc.customDimensions.remove(name);
}

function _unregisterCustomPage(name) {
    remote_dc.customPages.remove(name);
}

function _setChartFilter(chart, filters) {
    remote_dc.filters.set(chart.chartID(), filters);
}

function _resetChartFilter(chart) {
    remote_dc.filters.remove(chart.chartID());
}

function _setCustomFilter(dimension, customFilter) {
    remote_dc.customFilters.set(dimension, customFilter);
}

function _resetCustomFilter(dimension) {
    remote_dc.customFilters.remove(dimension);
}

function _getChartFilter(chart) {
    return remote_dc.filters.get(chart.chartID());
}

function _getCustomFilter(dimension) {
    return remote_dc.customFilters.get(dimension);
}

function _remoteRenderGroup(chartGroup, callback) {
    _remoteRenderAll([chartGroup], callback);
}

function _remoteRedrawGroup(chartGroup, callback) {
    _remoteRedrawAll([chartGroup], callback);
}

function _remoteRenderAll(chartGroups, callback) {
    _remoteRender(_allCharts(chartGroups), callback);
}

function _remoteRedrawAll(chartGroups, callback) {
    _remoteRedraw(_allCharts(chartGroups), callback);
}

function _remoteRender(charts, callback) {
    _remoteChartUpdate(charts, function(chart) {
        chart.render();
    }, callback);
}

function _remoteRedraw(charts, callback) {
    _remoteChartUpdate(charts, function(chart) {
        chart.redraw();
    }, callback);
}

function _resetGroup(chartGroup) {
    _resetAll([chartGroup]);
}

function _resetAll(chartGroups) {
    _reset(_allCharts(chartGroups));
}

function _reset(charts) {
    charts.forEach(function(chart) {
        _resetChartFilter(chart);
    });
}

function _allCharts(chartGroups) {
    var charts = [];
    if (chartGroups) {
        chartGroups.forEach(function(chartGroup) {
            charts = charts.concat( dc.chartRegistry.list(chartGroup) );
        });
    }
    return charts;
}

function _remoteChartUpdate(charts, callback, endCallback) {
    var filters = {};

    var groups = {};
    var dimensions = {};
    var pages = {};

    for (var i = 0; i < charts.length; i++) {
        if (charts[i].hasRemoteDimension()) {
            var chartFilters = _getChartFilter(charts[i]);
            if (chartFilters && chartFilters.length > 0) {
                _addFilter(filters, charts[i].dimension().name(), {
                    value : chartFilters
                });
            }
        }

        if (charts[i].hasRemoteGroup()) {
            charts[i].group().markToUpdate( groups );
        }

        if (charts[i].hasRemoteDimension()) {
            charts[i].dimension().markToUpdate( dimensions );
        }

        if (charts[i].hasRemotePage()) {
            charts[i].pageData().markToUpdate( pages );
        }
    }

    remote_dc.customFilters.forEach(function(dimension, filter) {
        _addFilter(filters, dimension, filter);
    });

    remote_dc.customDimensions.forEach(function(name, dimension) {
        dimension.markToUpdate( dimensions );
    });

    remote_dc.customPages.forEach(function(name, page) {
        page.markToUpdate( pages );
    });

    remote_dc.customGroups.forEach(function(name, group) {
        group.markToUpdate( groups );
    });

    _remoteFilter(filters, dimensions, groups, pages, function(data) {
        for (var i = 0; i < charts.length; i++) {
            if (charts[i].remoteChart) {
                callback(charts[i]);
            }
        }
        if (endCallback) {
            endCallback();
        }
    });
};

function _remoteFilter(filters, dimensions, groups, pages, callback) {
    // console.log('remote filter', {
    //     filters: filters,
    //     dimensions: dimensions,
    //     groups : groups,
    //     pages: pages
    // });

    if (remote_dc.onPreUpdate) {
        remote_dc.onPreUpdate(filters, dimensions, groups, pages);
    }

    d3.json( _buildFilterURL(filters, dimensions, groups, pages), _remoteDataUpdateCallback(function(data) {
        if (remote_dc.onPostUpdate) {
            remote_dc.onPostUpdate(data);
        }
        callback(data);
    }) );
}

function _remoteDataUpdate(dimensions, groups, pages, callback) {
    // console.log('remote data update', {
    //     dimensions: dimensions,
    //     groups : groups,
    //     pages: pages
    // });

    d3.json( _buildUpdateDataURL(dimensions, groups, pages), _remoteDataUpdateCallback(callback) );
}

function _remoteDimensionsUpdate(dimensions, callback) {
    _remoteDataUpdate(dimensions, {}, {}, callback);
}

function _remoteGroupsUpdate(groups, callback) {
    _remoteDataUpdate({}, groups, {}, callback);
}

function _remotePagesUpdate(pages, callback) {
    _remoteDataUpdate({}, {}, pages, callback);
}

function _remoteDataUpdateCallback(callback) {
    return function(error, data) {
        if (error) {
            if (remote_dc.onCommunicationError) {
                remote_dc.onCommunicationError(error);
            } else {
                console.log(error);
            }
        } else {
            _updateServerData(data);
            callback(data);
        }
    }
}

function _addFilter(filters, dimension, filter) {
    _initFilter(filters, dimension);
    if (filter) {
        for (var i = 0; i < filters[dimension].length; i++) {
            var existingFilter = filters[dimension];
            if (_safeEquals(existingFilter.type, filter.type)) {
                existingFilter.value = [].concat(existingFilter.value).concat(filter.value);
                return;
            }
        }
        filters[dimension].push(filter);
    }
}

function _safeEquals(o1, o2) {
    if (!o1 || !o2) {
        return o1 == o2;
    }
    return o1 == o2 || o1.equals(o2);
}

function _initFilter(filters, dimension) {
    if ( !(dimension in filters) ) {
        filters[dimension] = [];
    }
}

function _buildFilterURL(filters, dimensions, groups, pages) {
    return _buildURL(remote_dc.crossfilterBaseUrl, {
            filters: JSON.stringify(filters),
            groups: JSON.stringify(groups),
            dimensions: JSON.stringify(dimensions),
            pages: JSON.stringify(pages)
        });
}

function _buildUpdateDataURL(dimensions, groups, pages) {
    return _buildURL(remote_dc.updateDataBaseUrl, {
            groups: JSON.stringify(groups),
            dimensions: JSON.stringify(dimensions),
            pages: JSON.stringify(pages)
        });
}

function _buildURL(base, params) {
    return base + _buildURLParams(params);
}

function _buildURLParams(params) {
    var parameters = [];
    for (param in params) {
        parameters.push(encodeURIComponent(param) + "=" + encodeURIComponent(params[param]));
    }
    return parameters.join("&");
}

function _updateServerData(data) {
    // console.log('server data', data);

    if (data.state) {
        remote_dc.serverData.state = data.state;
    }

    if (data.groups) {
        for (group in data.groups) {
            remote_dc.serverData.groups[group] = data.groups[group];
        }
    }

    if (data.dimensions) {
        for (dimension in data.dimensions) {
            remote_dc.serverData.dimensions[dimension] = data.dimensions[dimension];
        }   
    }

    if (data.pages) {
        for (page in data.pages) {
            remote_dc.serverData.pages[page] = data.pages[page];
        }   
    }
}

function _dimensionServerData(dimensionName, method, defaultData) {
    var dimensionData = remote_dc.serverData.dimensions[dimensionName] || {};
    return dimensionData[method] || defaultData;
}

function _groupServerData(groupName, method, defaultData) {
    var groupData = remote_dc.serverData.groups[groupName] || {};
    return groupData[method] || defaultData;
}

function _pageServerData(pageName, method, defaultData) {
    var pageData = remote_dc.serverData.pages[pageName] || {};
    return pageData[method] || defaultData;
}

function _stateServerData() {
    return remote_dc.serverData.state;
}

function _parseConfig(config) {
    return typeof config === 'function' ? config() : config;
}
