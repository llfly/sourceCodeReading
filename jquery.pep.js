/*
 *         ________                                                            ________
 *         ______(_)_____ ____  __________________  __ _____________________   ______(_)_______
 *         _____  /_  __ `/  / / /  _ \_  ___/_  / / / ___  __ \  _ \__  __ \  _____  /__  ___/
 *         ____  / / /_/ // /_/ //  __/  /   _  /_/ /____  /_/ /  __/_  /_/ /______  / _(__  )
 *         ___  /  \__, / \__,_/ \___//_/    _\__, /_(_)  .___/\___/_  .___/_(_)__  /  /____/
 *         /___/     /_/                     /____/    /_/          /_/        /___/
 *
 *        http://pep.briangonzalez.org
 *        Kinetic drag for mobile/desktop.
 *
 *        Copyright (c) 2014 Brian Gonzalez
 *        Licensed under the MIT license.
 *
 *        Title generated using "Speed" @
 *        http://patorjk.com/software/taag/#p=display&f=Speed&t=jquery.pep.js
 */

;(function ( $, window, undefined ) {

  "use strict";

  //初始化
  var pluginName = 'pep';
  var defaults   = {

    // Options
    // ----------------------------------------------------------------------------------------------
    // 查看 ** https://github.com/briangonzalez/jquery.pep.js ** 获取完整的文件说明
    // ----------------------------------------------------------------------------------------------
    initiate:                       function(){},//当第一次touch/click事件在物体上触发时[touchstart/mousedown]事件被调用
    start:                          function(){},//拖动开始时被调用; 当dx(dy)比startThreshold[0](startThreshold[1])大
    drag:                           function(){},//当物体被拖动时[touchmove/mousemove]事件一直被调用
    stop:                           function(){},//当拖动停止时[ touchend/mouseup]事件被调用
    easing:                         null,//当物体设置缓动时调用
    rest:                           function(){},//当物体拖动停止并且设置后被调用
    moveTo:                         false,//自定义的移动方法，用来覆盖默认的moveTo方法
    callIfNotStarted:               ['stop', 'rest'],//如果物体没有移动到startThreshold的外面，调用用户自定义的stop或者rest方法
    startThreshold:                 [0,0],//在用户调用"start"方法之前物体可以在[x,y]方向移动的距离
    grid:                           [1,1],//定义物体可以在[x,y]方向上移动多少格
    debug:                          false,//在页面右下方显示调试值和事件
    activeClass:                    'pep-active',//在调用initiate事件时添加样式，在缓动动作完成后清除
    multiplier:                     1,//可正可负，这个数字来用修改手指/鼠标的运动和对象运动的比率
    velocityMultiplier:             2.5,//可正可负，用于修改释放物体时的弹性参数
    shouldPreventDefault:           true,//阻止mousedown/touchstart事件在对象的默认行为
    allowDragEventPropagation:      true,//是否不阻止拖动事件在dom树的事件冒泡行为
    stopEvents:                     '',//设置事件名称使动作停下来
    hardwareAccelerate:             true,//使用css3技巧去硬件加速 http://indiegamr.com/ios6-html-hardware-acceleration-changes-and-how-to-fix-them/
    useCSSTranslation:              true,//使用css translation来转换位置
    disableSelect:                  true,//是否把css属性user-select:none加到物体上，即是否控制内容的可选择性 http://www.qianduan.net/introduce-user-select/
    cssEaseString:                  "cubic-bezier(0.190, 1.000, 0.220, 1.000)",//缓动模型，可以从 [ http://matthewlein.com/ceaser/ ]获取更多的缓动模型 http://easings.net/zh-cn
    cssEaseDuration:                1000,//物体缓动持续时间
    shouldEase:                     true,//是否有释放动作（在释放对象时的缓动）
    droppable:                      false,//css选择器对象，这个元素的位置可以被对象放置，假以禁用
    droppableActiveClass:           'pep-dpa',//当目标触发可放置的区域时，可放置的区域的样式，默认为pep-dpa
    overlapFunction:                false,//判断覆盖方法；接受两个参数a,b如果重叠返回true，如果要设置放置区域，该方法必须为false
    constrainTo:                    false,//限制对象活动边框'window'或者'parent'或者'[top, right, bottom, left]';为了更好效果可将useCSSTranslation属性设置为false 
    removeMargins:                  true,//是否移除对象的margin
    place:                          true,//忽视对象的布局逻辑
    deferPlacement:                 false,//在start事件发生前阻止对象的布局
    axis:                           null,//限制对象在 'x' 或 'y' 轴上移动
    forceNonCSS3Movement:           false,//不要使用，这个受come/to限制，必须自行承担使用风险。
    elementsWithInteraction:        'input',//在对象内部可以进行有效交互的CSS/jQuery元素选择器，它们可以传递运动状态（事件冒泡）
    revert:                         false,//恢复到初始位置
    revertAfter:                    'stop',//添加条件，在"stop"或"ease"后执行判断并恢复函数
    revertIf:                       function(){ return true; },//根据条件(true/false)是否恢复对象
    ignoreRightClick:               true,//如果点击鼠标右键start事件将会终止
    startPos:                       {//在对象加载时设定默认的left/top坐标
        left:                           null,
        top:                            null
    }
  };

  //pep对象
  function Pep( el, options ) {

    this.name = pluginName;

    this.el  = el;
    this.$el = $(el);

    //合并初始化
    this.options    = $.extend( {}, defaults, options) ;

    //用于设置物体活动区域，与constrainTo属性parent,window对应
    this.$document  = $(this.$el[0].ownerDocument);
    this.$body      = this.$document.find('body');

    //基于touch/click驱动创建触发器
    this.moveTrigger        = "MSPointerMove pointermove touchmove mousemove";
    this.startTrigger       = "MSPointerDown pointerdown touchstart mousedown";
    this.stopTrigger        = "MSPointerUp pointerup touchend mouseup";
    this.startTriggerArray  = this.startTrigger.split(' ');
    this.moveTriggerArray   = this.moveTrigger.split(' ');
    this.stopTriggerArray   = this.stopTrigger.split(' ');
    this.stopEvents         = [ this.stopTrigger, this.options.stopEvents ].join(' ');

    //判断物体活动区域的设置
    if ( this.options.constrainTo === 'window' )
      this.$container = this.$document;
    else if ( this.options.constrainTo && (this.options.constrainTo !== 'parent') )
      this.$container = $(this.options.constrainTo);
    else
      this.$container = this.$el.parent();

    //兼容IE设置
    if ( this.isPointerEventCompatible() )
      this.applyMSDefaults();

    this.CSSEaseHash    = this.getCSSEaseHash();//获取缓动模型的样式
    this.scale          = 1;//缩放级别
    this.started        = false;//用于判断一次事件是否结束
    this.disabled       = false;
    this.activeDropRegions = [];//可放置区域数组
    this.resetVelocityQueue();// 定义速度队列

    this.init();
    return this;
  }

  //  init();
  //  初始化逻辑
  Pep.prototype.init = function () {
    //根据debug属性选择是否创建调试信息板
    if ( this.options.debug )
      this.buildDebugDiv();
    //是否控制内容的可选择性
    if ( this.options.disableSelect )
      this.disableSelect();
    // 设置父元素及元素的定位方式
    if ( this.options.place && !this.options.deferPlacement ) {
      this.positionParent();
      this.placeObject();
    }

    this.ev = {};       // 用于存储事件集合
    this.pos = {};      // 用于存储位置集合
    this.subscribe();   // 用于定制事件
  };

  //  subscribe();
  //  对物体添加事件
  //  e.g.:$('#pep').trigger('stop')
  Pep.prototype.subscribe = function () {
    var self = this;

    // 定制start事件的处理程序
    this.onStartEvent = function(ev){ self.handleStart(ev); };
    //绑定startTrigger事件
    this.$el.on(this.startTrigger, this.onStartEvent);

    // 对可以进行有效交互的对象自定义的内部元素绑定事件，即阻止冒泡
    this.onStartEventOnElementsWithInteraction = function(ev){ ev.stopPropagation(); };
    this.$el.on(
      this.startTrigger,
      this.options.elementsWithInteraction,
      this.onStartEventOnElementsWithInteraction
    );

    // 定制stop事件的处理程序
    this.onStopEvents = function(ev) { self.handleStop(ev); };
    //绑定stopEvents事件
    this.$document.on(this.stopEvents, this.onStopEvents);

    // 定制move事件
    this.onMoveEvents = function(ev){ self.moveEvent = ev; };
    //绑定moveTrigger事件
    this.$document.on(this.moveTrigger, this.onMoveEvents);
  };


  Pep.prototype.unsubscribe = function() {
    this.$el.off(this.startTrigger, this.onStartEvent);
    this.$el.off(
      this.startTrigger,
      this.options.elementsWithInteraction,
      this.onStartEventOnElementsWithInteraction
    );
    this.$document.off(this.stopEvents, this.onStopEvents);
    this.$document.off(this.moveTrigger, this.onMoveEvents);
  };

  //  handleStart();
  //  所有this.startTrigger事件的处理程序
  Pep.prototype.handleStart = function(ev) {
    var self = this;

            // 只有持续的触发才是一个有效的start事件
            if ( this.isValidMoveEvent(ev) && !this.disabled ){
              //关于鼠标右键的判断
              //ev.which 1为左键，2为中键，3为右键
              if( !(this.options.ignoreRightClick && ev.which === 3) ) {

                    // IE10 Hack
                    if ( this.isPointerEventCompatible() && ev.preventManipulation )
                      ev.preventManipulation();//如果不加上这句, 则屏幕的拖动会代替绘图的动作

                    // 正常的事件处理
                    ev = this.normalizeEvent(ev);

                    // 如果没有阻止初始化的设置的话，处理父元素及元素本身的定位方式
                    if ( this.options.place && this.options.deferPlacement ) {
                      this.positionParent();
                      this.placeObject();
                    }

                    // 打印日志记录事件类型
                    this.log({ type: 'event', event: ev.type });

                    // 硬件加速
                    if ( this.options.hardwareAccelerate && !this.hardwareAccelerated ) {
                      this.hardwareAccelerate();
                      this.hardwareAccelerated = true;
                    }

                    // 绑定用户的开始事件
                    var shouldContinue = this.options.initiate.call(this, ev, this);
                    if ( shouldContinue === false )
                      return;

                    // 取消超时rest
                    clearTimeout( this.restTimeout );

                    // 添加动作类，重设css动画
                    this.$el.addClass( this.options.activeClass );
                    // 移除缓动css
                    this.removeCSSEasing();

                    // 保存事件触发的x,y值
                    this.startX = this.ev.x = ev.pep.x;
                    this.startY = this.ev.y = ev.pep.y;

                    // 保存最初物体的位置信息
                    this.initialPosition = this.initialPosition || this.$el.position();

                    // 保存最初的touch/click事件，用于计算最初的增量
                    this.startEvent = this.moveEvent = ev;

                    // 设置对象行为, 让watchMoveLoop事件开始循环
                    this.active = true;

                    // 阻止事件默认行为
                    if ( this.options.shouldPreventDefault )
                      ev.preventDefault();

                    // 是否阻止事件冒泡
                    if ( !this.options.allowDragEventPropagation )
                      ev.stopPropagation();

                    // animation loop to ensure we don't fire
                    // too many unneccessary repaints
                    // 用循环动画的方式阻止不必要的重新渲染
                    (function watchMoveLoop(){
                        if ( !self.active ) return;
                        self.handleMove();
                        self.requestAnimationFrame( watchMoveLoop );
                    })();

                    // 用循环动画的方式触发缓动函数
                    (function watchEasingLoop(){
                        if ( !self.options.easing ) return;
                        if ( self.easing ) self.options.easing.call(self, null, self);
                        self.requestAnimationFrame( watchEasingLoop );
                    })();
              }
            }
  };

  //  handleMove();
  //  处理物体在move时的逻辑
  Pep.prototype.handleMove = function() {

            // 设置事件对象
            if ( typeof(this.moveEvent) === 'undefined' )
              return;

            // 获取移动的x,y
            var ev      = this.normalizeEvent( this.moveEvent );
            var curX    = window.parseInt(ev.pep.x / this.options.grid[0]) * this.options.grid[0];
            var curY    = window.parseInt(ev.pep.y / this.options.grid[1]) * this.options.grid[1];

            // 通过后进先出(LIFO)队列来管理速度
            this.addToLIFO( { time: ev.timeStamp, x: curX, y: curY } );

            // 计算需要移动值
            var dx, dy;

            if ( $.inArray( ev.type, this.startTriggerArray ) > -1  ){
              dx = 0;
              dy = 0;
            } else{
              dx = curX - this.ev.x;
              dy = curY - this.ev.y;
            }

            this.dx   = dx;
            this.dy   = dy;
            this.ev.x = curX;
            this.ev.y = curY;

            // 在任何方向上都没有动作时return
            if (dx === 0 && dy === 0){
              this.log({ type: 'event', event: '** stopped **' });
              return;
            }

            // 检查对象在x/y上移动的值，如果存在
            var initialDx  = Math.abs(this.startX - curX);
            var initialDy  = Math.abs(this.startY - curY);
            if ( !this.started && ( initialDx > this.options.startThreshold[0] || initialDy > this.options.startThreshold[1] ) ){
              this.started = true;
              this.$el.addClass('pep-start');
              this.options.start.call(this, this.startEvent, this);
            }

            // Move before calculate position and fire events
            // 在移动之前计算对象到达的位置
            this.doMoveTo(dx, dy);

            // 计算可放置区属性
            if ( this.options.droppable ) {
              this.calculateActiveDropRegions();
            }

            // 如果继续拖动则继续调用函数
            var continueDrag = this.options.drag.call(this, ev, this);

            if ( continueDrag === false ) {
              this.resetVelocityQueue();//重新初始化速度数组并返回
              return;
            }

            // 打印日志
            this.log({ type: 'event', event: ev.type });
            this.log({ type: 'event-coords', x: this.ev.x, y: this.ev.y });
            this.log({ type: 'velocity' });
  };

  Pep.prototype.doMoveTo = function(dx, dy) {
            //获取边界hash值
            var hash = this.handleConstraint(dx, dy);
            var xOp, yOp;

            // 先判断有没有自定义移动动画
            if ( typeof this.options.moveTo === 'function') {
              xOp     = ( dx >= 0 ) ? "+=" + Math.abs(dx/this.scale)*this.options.multiplier : "-=" + Math.abs(dx/this.scale)*this.options.multiplier;
              yOp     = ( dy >= 0 ) ? "+=" + Math.abs(dy/this.scale)*this.options.multiplier : "-=" + Math.abs(dy/this.scale)*this.options.multiplier;
              //比对边界hash值，取合理值
              if ( this.options.constrainTo ) {
                xOp = (hash.x !== false) ? hash.x : xOp;
                yOp = (hash.y !== false) ? hash.y : yOp;
              }

              //如果有设置单方向移动，取合理值
              if ( this.options.axis  === 'x' ) yOp = hash.y;
              if ( this.options.axis  === 'y' ) xOp = hash.x;
              //调用移动函数
              this.options.moveTo.call(this, xOp, yOp);
            } else if ( !this.shouldUseCSSTranslation() ){
              //通过默认移动动画来移动
              xOp     = ( dx >= 0 ) ? "+=" + Math.abs(dx/this.scale)*this.options.multiplier : "-=" + Math.abs(dx/this.scale)*this.options.multiplier;
              yOp     = ( dy >= 0 ) ? "+=" + Math.abs(dy/this.scale)*this.options.multiplier : "-=" + Math.abs(dy/this.scale)*this.options.multiplier;
              //比对边界hash值，取合理值
              if ( this.options.constrainTo ) {
                xOp = (hash.x !== false) ? hash.x : xOp;
                yOp = (hash.y !== false) ? hash.y : yOp;
              }

              //如果有设置单方向移动，取合理值
              if ( this.options.axis  === 'x' ) yOp = hash.y;
              if ( this.options.axis  === 'y' ) xOp = hash.x;
              //调用移动函数
              this.moveTo(xOp, yOp);
            }
            else {
              //如果是通过css transforms转换
              dx = (dx/this.scale)*this.options.multiplier;
              dy = (dy/this.scale)*this.options.multiplier;
              //比对边界hash值，取合理值
              if ( this.options.constrainTo ) {
                dx = (hash.x === false) ? dx : 0 ;
                dy = (hash.y === false) ? dy : 0 ;
              }

              //如果有设置单方向移动，取合理值
              if ( this.options.axis  === 'x' ) dy = 0;
              if ( this.options.axis  === 'y' ) dx = 0;

              this.moveToUsingTransforms( dx, dy );
            }
  };

  //  handleStop();
  //  所有this.onStopEvents事件的处理程序
  Pep.prototype.handleStop = function(ev) {

            // no need to handle stop event if we're not active
            if (!this.active)
              return;

            // 打印日志记录事件类型
            this.log({ type: 'event', event: ev.type });

            // make object inactive, so watchMoveLoop returns
            this.active = false;

            // 将缓动参数附加给对象
            this.easing = true;

            // 移除start时的样式,添加释放时样式
            this.$el.removeClass('pep-start')
                    .addClass('pep-ease');

            // 计算可放置区的属性
            // calculateActiveDropRegions
            if ( this.options.droppable ) {
              this.calculateActiveDropRegions();
            }

            // fire user's stop event.
            if ( this.started || (!this.started &&  $.inArray('stop', this.options.callIfNotStarted) > -1 ) ) {
              this.options.stop.call(this, ev, this);
            }

            // 判断缓动
            if (this.options.shouldEase) {
              this.ease(ev, this.started);
            } else {
              this.removeActiveClass();
            }
            //判断是否有恢复到初始位置的设置
            if ( this.options.revert && (this.options.revertAfter === 'stop' || !this.options.shouldEase) && ( this.options.revertIf && this.options.revertIf.call(this) ) ) {
              this.revert();
            }

            // 这个属性必须在stop事件被调用后设为false
            this.started = false;

            // 重新初始化速度队列
            this.resetVelocityQueue();

  };

  //  ease();
  //    used in conjunction with the LIFO queue
  //    to ease the object after stop
  //  用于结合后进先出队列
  Pep.prototype.ease = function(ev, started){

            var pos       = this.$el.position();
            var vel       = this.velocity();
            var dt        = this.dt;
            var x         = (vel.x/this.scale) * this.options.multiplier;
            var y         = (vel.y/this.scale) * this.options.multiplier;

            var hash      = this.handleConstraint(x, y, true);

            // 如果浏览器支持css动画，添加之
            if ( this.cssAnimationsSupported() )
              this.$el.css( this.getCSSEaseHash() );

            var xOp = ( vel.x > 0 ) ? "+=" + x : "-=" + Math.abs(x);
            var yOp = ( vel.y > 0 ) ? "+=" + y : "-=" + Math.abs(y);

            if ( this.options.constrainTo ) {
              xOp = (hash.x !== false) ? hash.x : xOp;
              yOp = (hash.y !== false) ? hash.y : yOp;
            }

            if ( this.options.axis  === 'x' ) yOp = "+=0";
            if ( this.options.axis  === 'y' ) xOp = "+=0";

            // ease it via JS, the last true tells it to animate.
            // 由js来缓解
            var jsAnimateFallback = !this.cssAnimationsSupported() || this.options.forceNonCSS3Movement;
            if (typeof this.options.moveTo === 'function') {
              this.options.moveTo.call(this, xOp, yOp);
            } else {
              this.moveTo(xOp, yOp, jsAnimateFallback);
            }

            // when the rest occurs, remove active class and call
            // user's rest event.
            var self = this;
            this.restTimeout = setTimeout( function(){

              // Calculate our drop regions
              if ( self.options.droppable ) {
                self.calculateActiveDropRegions();
              }

              self.easing = false;

              // call users rest event.
              if ( started || ( !started && $.inArray('rest', self.options.callIfNotStarted) > -1 ) ) {
                self.options.rest.call(self, ev, self);
              }

              // revert thy self!
              if ( self.options.revert && (self.options.revertAfter === 'ease' && self.options.shouldEase) && ( self.options.revertIf && self.options.revertIf.call(self) ) ) {
                self.revert();
              }

              // remove active class
              self.removeActiveClass();

            }, this.options.cssEaseDuration );

  };

  // normalizeEvent()
  // 正常的事件判断
  Pep.prototype.normalizeEvent = function(ev) {
      ev.pep        = {};
      //是不是touch事件，获取touch的x,y坐标以及type
      if ( this.isTouch(ev) ) {

        ev.pep.x      = ev.originalEvent.touches[0].pageX;
        ev.pep.y      = ev.originalEvent.touches[0].pageY;
        ev.pep.type   = ev.type;

      }//如果不是touch事件或者IE浏览器
      else if ( this.isPointerEventCompatible() || !this.isTouch(ev) ) {

        if ( ev.pageX  ) {
          ev.pep.x      = ev.pageX;
          ev.pep.y      = ev.pageY;
        } else {
          ev.pep.x      = ev.originalEvent.pageX;
          ev.pep.y      = ev.originalEvent.pageY;
        }

        ev.pep.type   = ev.type;

      }
      return ev;
   };

  // resetVelocityQueue()
  // 初始化速度队列
  Pep.prototype.resetVelocityQueue = function() {
    this.velocityQueue = new Array(5);
  };

  //  moveTo();
  //  把对象移动到x,y处（使用jQuery的css方法）
  Pep.prototype.moveTo = function(x,y, animate) {

    this.log({ type: 'delta', x: x, y: y });
    if ( animate ) {
      this.$el.animate({ top: y, left: x }, 0, 'easeOutQuad', {queue: false});
    } else{
      this.$el.stop(true, false).css({ top: y , left: x });
    }

  };

  //  moveToUsingTransforms();
  //  通过css transforms x,y值来对对象移动
  Pep.prototype.moveToUsingTransforms = function(x,y) {
    // 检查初始值，判断是否有matrix,并转换成数组类型
    var matrixArray  = this.matrixToArray( this.matrixString() );

    if ( !this.cssX )
      this.cssX = this.xTranslation( matrixArray );

    if ( !this.cssY )
      this.cssY = this.yTranslation( matrixArray );

    // 将x,y分别附加到matrix矩阵上
    this.cssX = this.cssX + x;
    this.cssY = this.cssY + y;

    this.log({ type: 'delta', x: x, y: y });

    matrixArray[4]    = this.cssX;
    matrixArray[5]    = this.cssY;
    // 再将数组转换成矩阵
    this.translation  = this.arrayToMatrix( matrixArray );
    // 根据不同浏览器附加transform属性
    this.transform( this.translation );
  };

  Pep.prototype.transform = function(value) {
    this.$el.css({
        '-webkit-transform': value,
           '-moz-transform': value,
            '-ms-transform': value,
             '-o-transform': value,
                'transform': value  });
  };

  //从matrix中获取x坐标
  Pep.prototype.xTranslation = function(matrixArray) {
    matrixArray  = matrixArray || this.matrixToArray( this.matrixString() );
    return parseInt(matrixArray[4], 10);
  };
  //从matrix中获取y坐标
  Pep.prototype.yTranslation = function(matrixArray) {
    matrixArray  = matrixArray || this.matrixToArray( this.matrixString() );
    return parseInt(matrixArray[5], 10);
  };

  //  matrixString();
  //  判断transform属性是否有matrix值，并返回
  //  三个相关函数：matrixString,matrixToArray,arrayToMatrix
  Pep.prototype.matrixString = function() {
    //根据不同浏览器判断transform属性，是否有matrix值
    var validMatrix = function(o){
      return !( !o || o === 'none' || o.indexOf('matrix') < 0  );
    };

    var matrix = "matrix(1, 0, 0, 1, 0, 0)";

    if ( validMatrix( this.$el.css('-webkit-transform') ) )
      matrix = this.$el.css('-webkit-transform');

    if ( validMatrix( this.$el.css('-moz-transform') ) )
      matrix = this.$el.css('-moz-transform');

    if ( validMatrix( this.$el.css('-ms-transform') ) )
      matrix = this.$el.css('-ms-transform');

    if ( validMatrix( this.$el.css('-o-transform') ) )
      matrix = this.$el.css('-o-transform');

    if ( validMatrix( this.$el.css('transform') ) )
      matrix = this.$el.css('transform');

    return matrix;
  };
  //  matrixToArray();
  //  将获取到的matrix值转换成数组
  Pep.prototype.matrixToArray = function(str) {
      return str.split('(')[1].split(')')[0].split(',');
  };
  //  arrayToMatrix();
  //  将matrix数组转换成matrix(,,,,,)
  Pep.prototype.arrayToMatrix = function(array) {
      return "matrix(" +  array.join(',')  + ")";
  };

  //  addToLIFO();
  //  一个长度为5的后进先出数组，用来存储速度点，被用来处理缓动
  Pep.prototype.addToLIFO = function(val){
    // 后进先出
    var arr = this.velocityQueue;
    arr = arr.slice(1, arr.length);
    arr.push(val);
    this.velocityQueue = arr;
  };

  //  velocity();
  //    using the LIFO, calculate velocity and return
  //    velocity in each direction (x & y)
  //  用于缓动队列，在x和y方向计算速度和返回速度
  Pep.prototype.velocity = function(){
    var sumX = 0;
    var sumY = 0;

    for ( var i = 0; i < this.velocityQueue.length -1; i++  ){
      if ( this.velocityQueue[i] ){
        sumX        += (this.velocityQueue[i+1].x - this.velocityQueue[i].x);
        sumY        += (this.velocityQueue[i+1].y - this.velocityQueue[i].y);
        this.dt     = ( this.velocityQueue[i+1].time - this.velocityQueue[i].time );
      }
    }

    // 返回不同方向的速度
    return { x: sumX*this.options.velocityMultiplier, y: sumY*this.options.velocityMultiplier};
  };

  //  revert();
  //  返回初始位置
  Pep.prototype.revert = function() {
    //根据translation和position两种方式设定
    if ( this.shouldUseCSSTranslation() ){
      this.moveToUsingTransforms(-this.xTranslation(),-this.yTranslation());
    }

    this.moveTo(this.initialPosition.right, this.initialPosition.bottom);
  };

  //  requestAnimationFrame();
  //    requestAnimationFrame Polyfill
  //    More info:
  //    http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  Pep.prototype.requestAnimationFrame = function(callback) {
    return  window.requestAnimationFrame        && window.requestAnimationFrame(callback)         ||
            window.webkitRequestAnimationFrame  && window.webkitRequestAnimationFrame(callback)   ||
            window.mozRequestAnimationFrame     && window.mozRequestAnimationFrame(callback)      ||
            window.oRequestAnimationFrame       && window.mozRequestAnimationFrame(callback)      ||
            window.msRequestAnimationFrame      && window.msRequestAnimationFrame(callback)       ||
            window.setTimeout(callback, 1000 / 60);
  };

  //  positionParent();
  // 对对象的父元素添加定位方式(relative或static)
  Pep.prototype.positionParent = function() {

    if ( !this.options.constrainTo || this.parentPositioned )
      return;

    this.parentPositioned = true;

    //根据父元素类别，对父元素添加relative或static
    if ( this.options.constrainTo === 'parent' ) {
      this.$container.css({ position: 'relative' });
    } else if ( this.options.constrainTo === 'window'             &&
                this.$container.get(0).nodeName !== "#document"   &&
                this.$container.css('position') !== 'static' )
    {
      this.$container.css({ position: 'static' });
    }

  };

  //  placeObject();
  //  对对象添加定位方式
  Pep.prototype.placeObject = function() {

    if ( this.objectPlaced )
      return;

    this.objectPlaced = true;
    //根据父元素定位方式设置对象offset属性为相对于父元素的偏移或相对于文档的偏移。
    this.offset = (this.options.constrainTo === 'parent' || this.hasNonBodyRelative() ) ?
                    this.$el.position() : this.$el.offset();

    //先获取物体原始位置坐标，再根据this.options.startpos重新渲染
    if ( parseInt( this.$el.css('left'), 10 ) )
      this.offset.left = this.$el.css('left');

    if (typeof this.options.startPos.left === "number")
        this.offset.left = this.options.startPos.left;

    if ( parseInt( this.$el.css('top'), 10 ) )
      this.offset.top = this.$el.css('top');

    if (typeof this.options.startPos.top === "number")
        this.offset.top = this.options.startPos.top;
    //移除margin属性
    if ( this.options.removeMargins )
      this.$el.css({margin: 0});
    //设置定位方式，位置
    this.$el.css({
      position:   'absolute',
      top:        this.offset.top,
      left:       this.offset.left
    });

  };

  //  hasNonBodyRelative()
  //  如果除了body之外的所有父元素定位方式都为relative则返回true
  Pep.prototype.hasNonBodyRelative = function() {
    return this.$el.parents().filter(function() {
        var $this = $(this);
        return $this.is('body') || $this.css('position') === 'relative';
    }).length > 1;
  };

  //  setScale()
  //    set the scale of the object being moved.
  Pep.prototype.setScale = function(val) {
    this.scale = val;
  };

  //  setMultiplier()
  //  在物体移动之前设置移动比率
  Pep.prototype.setMultiplier = function(val) {
    this.options.multiplier = val;
  };

  //  removeCSSEasing();
  //    remove CSS easing properties, if necessary
  Pep.prototype.removeCSSEasing = function() {
    if ( this.cssAnimationsSupported() )
      this.$el.css( this.getCSSEaseHash(true) );
  };

  //  disableSelect();
  //加上这个属性，对象将无法控制内容的可选择性
  Pep.prototype.disableSelect = function() {
    this.$el.css({
      '-webkit-touch-callout' : 'none',
        '-webkit-user-select' : 'none',
         '-khtml-user-select' : 'none',
           '-moz-user-select' : 'none',
            '-ms-user-select' : 'none',
                'user-select' : 'none'
    });

  };

  // removeActiveClass()
  // 移除样式
  Pep.prototype.removeActiveClass = function() {
    this.$el.removeClass( [this.options.activeClass, 'pep-ease'].join(' ') );
  };

  //  handleConstraint();
  //  返回一组关于对父元素或者window边框限制的hash值
  Pep.prototype.handleConstraint = function(dx, dy, accountForTranslation) {
    var pos               = this.$el.position();
    this.pos.x            = pos.left;
    this.pos.y            = pos.top;

    var hash              = { x: false, y: false };

    var upperYLimit, upperXLimit, lowerXLimit, lowerYLimit;

    // 记录位置信息
    this.log({ type: "pos-coords", x: this.pos.x, y: this.pos.y});
    //判断constrainTo属性是不是一个数组
    if ( $.isArray( this.options.constrainTo ) ) {
      //是数组，判断上右下左四个值是否存在来定界
      if ( this.options.constrainTo[3] !== undefined && this.options.constrainTo[1] !== undefined ) {
        //右边框判断
        upperXLimit     = this.options.constrainTo[1] === false ?  Infinity : this.options.constrainTo[1];
        //左边框判断
        lowerXLimit     = this.options.constrainTo[3] === false ? -Infinity : this.options.constrainTo[3];
      }
      if ( this.options.constrainTo[0] !== false && this.options.constrainTo[2] !== false ) {
        //下边框判断
        upperYLimit       = this.options.constrainTo[2] === false ?  Infinity : this.options.constrainTo[2];
        //上边框判断
        lowerYLimit       = this.options.constrainTo[0] === false ? -Infinity : this.options.constrainTo[0];
      }

      // is our object trying to move outside lower X & Y limits?
      // 判断对象是否试图移出最小限制区域
      // 分别从x,y判断（当前的物体位置 + 要滑动到的位置）是否超出左边框及上边框
      if ( this.pos.x + dx < lowerXLimit)     hash.x = lowerXLimit;
      if ( this.pos.y + dy < lowerYLimit)     hash.y = lowerYLimit;

    } else if ( typeof this.options.constrainTo === 'string' ) {
      //不是数组，则为父元素或window
      //上左限制为0，右下限制为父元素的宽度减掉物体的高宽（包括内边距和边框）
      lowerXLimit       = 0;
      lowerYLimit       = 0;
      upperXLimit       = this.$container.width()  - this.$el.outerWidth();
      upperYLimit       = this.$container.height() - this.$el.outerHeight();

      // 判断对象是否试图移出最小限制区域
      if ( this.pos.x + dx < 0 )              hash.x = 0;
      if ( this.pos.y + dy < 0 )              hash.y = 0;
    }

    // 判断对象是否试图移出最大限制区域（右下边框）
    if ( this.pos.x + dx > upperXLimit )    hash.x = upperXLimit;
    if ( this.pos.y + dy > upperYLimit )    hash.y = upperYLimit;

    // 当使用css translation来控制物体位置时
    if ( this.shouldUseCSSTranslation() && accountForTranslation ){
      if (hash.x === lowerXLimit && this.xTranslation() ) hash.x = lowerXLimit - this.xTranslation();
      if (hash.x === upperXLimit && this.xTranslation() ) hash.x = upperXLimit - this.xTranslation();

      if (hash.y === lowerYLimit && this.yTranslation() ) hash.y = lowerYLimit - this.yTranslation();
      if (hash.y === upperYLimit && this.yTranslation() ) hash.y = upperYLimit - this.yTranslation();
    }

    return hash;
  };

  //getCSSEaseHash();
  // 返回一组用于与this.options.cssEaseString属性(缓动模型)关联的hash
  Pep.prototype.getCSSEaseHash = function(reset){
    if ( typeof(reset) === 'undefined' ) reset = false;

    var cssEaseString;
    if (reset){
      cssEaseString = '';
    } else if ( this.CSSEaseHash ) {
      return this.CSSEaseHash;
    } else {
      cssEaseString = ['all', this.options.cssEaseDuration + 'ms', this.options.cssEaseString].join(' ');
    }

    return {
                  '-webkit-transition'   : cssEaseString,   // chrome, safari, etc.
                     '-moz-transition'   : cssEaseString,   // firefox
                      '-ms-transition'   : cssEaseString,   // microsoft
                       '-o-transition'   : cssEaseString,   // opera
                          'transition'   : cssEaseString    // future
          };
  };

  // calculateActiveDropRegions()
  // 计算可放置区域，并添加或移除样式
  Pep.prototype.calculateActiveDropRegions = function() {
    var self = this;
    this.activeDropRegions.length = 0;//清空数组对象
    //遍历每一个可以放置的对象，根据物体是否被覆盖，加上自定义的样式droppableActiveClass
    $.each( $(this.options.droppable), function(idx, el){
      var $el = $(el);
      if ( self.isOverlapping($el, self.$el) ){
        $el.addClass(self.options.droppableActiveClass);
        self.activeDropRegions.push($el);
      } else {
        $el.removeClass(self.options.droppableActiveClass);
      }
    });

  };

  //  isOverlapping();
  //  如果对象$a把$b覆盖，返回true
  Pep.prototype.isOverlapping = function($a,$b) {

    if ( this.options.overlapFunction ) {
      return this.options.overlapFunction($a,$b);
    }

    var rect1 = $a[0].getBoundingClientRect();//返回$a元素CSS 边框集合
    var rect2 = $b[0].getBoundingClientRect();//返回$b元素CSS 边框集合

    return !( rect1.right   < rect2.left  ||
              rect1.left    > rect2.right ||
              rect1.bottom  < rect2.top   ||
              rect1.top     > rect2.bottom  );
  };

  //  isTouch();
  //  返回事件是否是touch事件
  Pep.prototype.isTouch = function(ev){
    return ev.type.search('touch') > -1;
  };

  // isPointerEventCompatible();
  // 返回设备是否兼容指针事件，通常判断在win8设备上
  // 关于MSPointerEvent
  // http://www.ayqy.net/blog/html5%E8%A7%A6%E6%91%B8%E4%BA%8B%E4%BB%B6/
  // http://thx.github.io/mobile/300ms-click-delay/
  Pep.prototype.isPointerEventCompatible = function() {
    return ("MSPointerEvent" in window);
  };

  // applyMSDefaults();
  Pep.prototype.applyMSDefaults = function(first_argument) {
    this.$el.css({
        '-ms-touch-action' :    'none',
        'touch-action' :        'none',
        '-ms-scroll-chaining':  'none',
        '-ms-scroll-limit':     '0 0 0 0'
    });
  };

  //  isValidMoveEvent();
  //  当事件在非触屏设备或触屏设备上触发单一的touch事件时返回true
  Pep.prototype.isValidMoveEvent = function(ev){
    return ( !this.isTouch(ev) || ( this.isTouch(ev) && ev.originalEvent && ev.originalEvent.touches && ev.originalEvent.touches.length === 1 ) );
  };

  //  shouldUseCSSTranslation();
  //  当使用css transforms属性来移动对象时返回true
  Pep.prototype.shouldUseCSSTranslation = function() {

    if ( this.options.forceNonCSS3Movement )
      return false;

    if ( typeof(this.useCSSTranslation) !== "undefined" )
      return this.useCSSTranslation;

    var useCSSTranslation = false;

    if ( !this.options.useCSSTranslation || ( typeof(Modernizr) !== "undefined" && !Modernizr.csstransforms)){
      useCSSTranslation = false;
    }
    else{
      useCSSTranslation = true;
    }

    this.useCSSTranslation =  useCSSTranslation;
    return useCSSTranslation;
  };

  //  cssAnimationsSupported():
  //    如果浏览器支持css动画的话返回true
  //    被用于缓动系统
  Pep.prototype.cssAnimationsSupported = function() {

    if ( typeof(this.cssAnimationsSupport) !== "undefined" ){
      return this.cssAnimationsSupport;
    }

    // 如果页面引用Modernizr, 让它来处理
    if ( ( typeof(Modernizr) !== "undefined" && Modernizr.cssanimations) ){
      this.cssAnimationsSupport = true;
      return true;
    }

    var animation = false,
        elm = document.createElement('div'),
        animationstring = 'animation',
        keyframeprefix = '',
        domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
        pfx  = '';

    if( elm.style.animationName ) { animation = true; }

    if( animation === false ) {
      for( var i = 0; i < domPrefixes.length; i++ ) {
        if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
          pfx = domPrefixes[ i ];
          animationstring = pfx + 'Animation';
          keyframeprefix = '-' + pfx.toLowerCase() + '-';
          animation = true;
          break;
        }
      }
    }

    this.cssAnimationsSupport = animation;
    return animation;
  };

  //  hardwareAccelerate();
  //  加一个极简单的CSS3硬件加速
  Pep.prototype.hardwareAccelerate = function() {
    this.$el.css({
      '-webkit-perspective':          1000,
      'perspective':                  1000,
      '-webkit-backface-visibility':  'hidden',
      'backface-visibility':          'hidden'
    });
   };

  //  getMovementValues();
  //    returns object pos, event position, and velocity in each direction.
  Pep.prototype.getMovementValues = function() {
    return { ev: this.ev, pos: this.pos, velocity: this.velocity() };
   };

  // 创建调试信息模块
  // 创建一个小的div在屏幕的右下方
  // 显示物体运动的额外信息
  Pep.prototype.buildDebugDiv = function() {
    var $debugDiv;
    if ( $('#pep-debug').length === 0 ){
      //创建调试信息板的样式和dom结构
      $debugDiv = $('<div></div>');
      $debugDiv
        .attr('id', 'pep-debug')
        .append("<div style='font-weight:bold; background: red; color: white;'>DEBUG MODE</div>")
        .append("<div id='pep-debug-event'>no event</div>")
        .append("<div id='pep-debug-ev-coords'>event coords: <span class='pep-x'>-</span>, <span class='pep-y'>-</span></div>")
        .append("<div id='pep-debug-pos-coords'>position coords: <span class='pep-x'>-</span>, <span class='pep-y'>-</span></div>")
        .append("<div id='pep-debug-velocity'>velocity: <span class='pep-x'>-</span>, <span class='pep-y'>-</span></div>")
        .append("<div id='pep-debug-delta'>&Delta; movement: <span class='pep-x'>-</span>, <span class='pep-y'>-</span></div>")
        .css({
          position:   'fixed',
          bottom:     5,
          right:      5,
          zIndex:     99999,
          textAlign:  'right',
          fontFamily: 'Arial, sans',
          fontSize:   10,
          border:     '1px solid #DDD',
          padding:    '3px',
          background: 'white',
          color:      '#333'
        });
    }

    var self = this;
    //实时更新调试信息
    setTimeout(function(){
      self.debugElements = {
        $event:      $("#pep-debug-event"),
        $velocityX:  $("#pep-debug-velocity .pep-x"),
        $velocityY:  $("#pep-debug-velocity .pep-y"),
        $dX:         $("#pep-debug-delta .pep-x"),
        $dY:         $("#pep-debug-delta .pep-y"),
        $evCoordsX:  $("#pep-debug-ev-coords .pep-x"),
        $evCoordsY:  $("#pep-debug-ev-coords .pep-y"),
        $posCoordsX: $("#pep-debug-pos-coords .pep-x"),
        $posCoordsY: $("#pep-debug-pos-coords .pep-y")
      };
    }, 0);

    $('body').append( $debugDiv );
  };

  //日志信息，debug属性为true时，在右下方显示事件，坐标信息等
  Pep.prototype.log = function(opts) {
    if ( !this.options.debug ) return;

    switch (opts.type){
    case "event":
      this.debugElements.$event.text(opts.event);
      break;
    case "pos-coords":
      this.debugElements.$posCoordsX.text(opts.x);
      this.debugElements.$posCoordsY.text(opts.y);
      break;
    case "event-coords":
      this.debugElements.$evCoordsX.text(opts.x);
      this.debugElements.$evCoordsY.text(opts.y);
      break;
    case "delta":
      this.debugElements.$dX.text(opts.x);
      this.debugElements.$dY.text(opts.y);
      break;
    case "velocity":
      var vel = this.velocity();
      this.debugElements.$velocityX.text( Math.round(vel.x) );
      this.debugElements.$velocityY.text( Math.round(vel.y) );
      break;
    }
  };

  // toggle()
  // 切换pep对象
  Pep.prototype.toggle = function(on) {
    if ( typeof(on) === "undefined"){
      this.disabled = !this.disabled;
    }
    else {
      this.disabled = !on;
    }
  };

  //  *** Special Easings functions ***
  //    Used for JS easing fallback
  //    We can use any of these for a
  //    good intertia ease
  $.extend($.easing,
  {
    easeOutQuad: function (x, t, b, c, d) {
      return -c *(t/=d)*(t-2) + b;
    },
    easeOutCirc: function (x, t, b, c, d) {
      return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
    },
    easeOutExpo: function (x, t, b, c, d) {
      return (t===d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
    }
  });

  //  wrap it
  //    A really lightweight plugin wrapper around the constructor,
  //    preventing against multiple instantiations.
  $.fn[pluginName] = function ( options ) {
    return this.each(function () {
      if (!$.data(this, 'plugin_' + pluginName)) {
        var pepObj = new Pep( this, options );
        $.data(this, 'plugin_' + pluginName, pepObj);
        $.pep.peps.push(pepObj);
      }
    });
  };

  //  The   _   ___ ___
  //       /_\ | _ \_ _|
  //      / _ \|  _/| |
  //     /_/ \_\_| |___|
  //
  $.pep = {};
  $.pep.peps = [];
  $.pep.toggleAll = function(on){
    $.each(this.peps, function(index, pepObj){
      pepObj.toggle(on);
    });
  };

  $.pep.unbind = function($obj){
    var pep = $obj.data('plugin_' + pluginName);

    if ( typeof pep === 'undefined' )
      return;

    pep.toggle(false);
    pep.unsubscribe();
    $obj.removeData('plugin_' + pluginName);

  };

}(jQuery, window));
