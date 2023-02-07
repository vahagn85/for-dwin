import { RatingProps } from "./Rating.props";
import styles from "./Rating.module.css";
import {
  useEffect,
  useState,
  KeyboardEvent,
  forwardRef,
  ForwardedRef,
  useRef,
} from "react";
import cn from "classnames";
import { BsStarFill, BsStar, BsStarHalf } from "react-icons/bs";

export const Rating = forwardRef(
  (
    {
      isEditable = false,
      rating,
      error,
      tabIndex,
      setRating,
      className,
      ...props
    }: RatingProps,
    ref: ForwardedRef<HTMLDivElement>
  ): JSX.Element => {
    const [ratingArray, setRatingArray] = useState<JSX.Element[]>(
      new Array(5).fill(<></>)
    );
    const ratingArrayRef = useRef<(HTMLSpanElement | null)[]>([]);

    useEffect(() => {
      constructRating(rating);
    }, [rating, tabIndex]);

    const computeFocus = (r: number, i: number): number => {
      if (!isEditable) {
        return -1;
      }
      if (!rating && i == 0) {
        return tabIndex ?? 0;
      }
      if (r == i + 1) {
        return tabIndex ?? 0;
      } else {
        return -1;
      }
    };
    const constructRating = (currentRating: number) => {
      // console.log(currentRating, 999);
      const updatedArray = ratingArray.map((r: JSX.Element, i: number) => {
        return (
          <span
            className={cn(styles.star, {
              [styles.filled]: i < currentRating,
              [styles.editable]: isEditable,
            })}
            key={i}
            onMouseEnter={() => changeDisplay(i + 1)}
            onMouseLeave={() => changeDisplay(rating)}
            onClick={() => onClick(i + 1)}
            tabIndex={computeFocus(rating, i)}
            onKeyDown={handleKey}
            ref={(r) => ratingArrayRef.current?.push(r)}
            role={isEditable ? "slider" : ""}
            aria-valuenow={rating}
            aria-valuemax={5}
            aria-label={isEditable ? "Enter rating" : "rating" + rating}
            aria-valuemin={1}
          >
            {i < currentRating ? <BsStarFill fill="#ffc107" /> : <BsStar />}
          </span>
        );
      });
      setRatingArray(updatedArray);
    };

    const changeDisplay = (i: number) => {
      if (!isEditable) {
        return;
      }
      constructRating(i);
    };
    const onClick = (i: number) => {
      if (!isEditable || !setRating) {
        return;
      }
      setRating(i);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (!isEditable || !setRating) {
        return;
      }

      if (e.code == "ArrowRight" || e.code == "ArrowUp") {
        if (!rating) {
          setRating(1);
        } else {
          e.preventDefault();
          setRating(rating < 5 ? rating + 1 : 5);
        }
        ratingArrayRef.current[rating]?.focus();
      }
      if (e.code == "ArrowLeft" || e.code == "ArrowDown") {
        e.preventDefault();
        setRating(rating > 1 ? rating - 1 : 1);
        ratingArrayRef.current[rating - 2]?.focus();
      }
    };
    // console.log(rating, 888888);
    return (
      <div
        {...props}
        ref={ref}
        className={cn(styles.ratingWrapper, {
          [styles.error]: error,
        })}
      >
        {ratingArray.map((r, i) => (
          <span key={i}>{r}</span>
        ))}
        {error && <span role="alert">{error.message}</span>}
      </div>
    );
  }
);
Rating.displayName = "Rating";
